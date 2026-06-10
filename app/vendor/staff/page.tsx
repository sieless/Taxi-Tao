"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth-context";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Search, 
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Copy,
  Link,
  Check,
  X,
  ShieldAlert,
  Trash2,
  Phone,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from "@/lib/firebase";
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

export default function StaffManagementPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [approvingStaff, setApprovingStaff] = useState<any>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvedCredentials, setApprovedCredentials] = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [allocationPermissions, setAllocationPermissions] = useState({
    manageFleet: false,
    manageYard: false,
    manageDrivers: false,
    manageMaintenance: false,
    viewFinance: false,
  });

  const handleCreateInviteLink = async () => {
    if (!userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;
    setInviting(true);
    setCopied(false);
    try {
      const tokenId = crypto.randomUUID();
      const tokenRef = doc(db, "invitations", tokenId);
      
      await setDoc(tokenRef, {
        id: tokenId,
        companyId: companyId,
        role: "assistant",
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taxitao.co.ke';
      const url = `${origin}/join?token=${tokenId}`;
      setInviteUrl(url);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating invitation:", error);
      }
      alert("Failed to generate invitation link. Please try again.");
    } finally {
      setInviting(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteStaff = async (staffId: string, name: string) => {
    if (!confirm(`Remove ${name || "this staff member"} from your company team?`)) return;
    try {
      await deleteDoc(doc(db, "users", staffId));
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error removing staff:", error);
      }
      alert("Failed to remove staff member.");
    }
  };

  const togglePermission = async (staffId: string, permission: string) => {
    try {
      const staffMember = staff.find(s => s.id === staffId);
      if (!staffMember) return;
      const updatedPermissions = {
        ...(staffMember.permissions || {}),
        [permission]: !(staffMember.permissions as any)?.[permission],
      };
      await updateDoc(doc(db, "users", staffId), { permissions: updatedPermissions });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating permissions:", error);
      }
      alert("Failed to update permissions.");
    }
  };

  const handleApproveStaff = async () => {
    if (!approvingStaff) return;
    const { id: tokenId, staffName: name, staffEmail: email, staffPhone: phone } = approvingStaff;
    setApprovalModalOpen(false);

    try {
      const uppers = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      const lowers = "abcdefghijkmnopqrstuvwxyz";
      const numbers = "23456789";
      const specials = "!@#$%^&*";
      const allChars = uppers + lowers + numbers;
      let tempPassword = uppers.charAt(Math.floor(Math.random() * uppers.length));
      tempPassword += lowers.charAt(Math.floor(Math.random() * lowers.length));
      tempPassword += numbers.charAt(Math.floor(Math.random() * numbers.length));
      tempPassword += specials.charAt(Math.floor(Math.random() * specials.length));
      for (let i = 0; i < 6; i++) {
        tempPassword += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      tempPassword = tempPassword.split("").sort(() => 0.5 - Math.random()).join("");

      const functions = getFunctions(app, "europe-west3");
      const createStaffAccountFn = httpsCallable(functions, "createStaffAccount");
      const result = await createStaffAccountFn({
        email,
        name: name || "Staff Member",
        password: tempPassword,
        phone: phone || "",
        companyId: userProfile?.companyId,
        permissions: allocationPermissions,
      });

      await updateDoc(doc(db, "invitations", tokenId), {
        status: "approved",
        usedBy: (result.data as any)?.uid || tokenId,
        usedAt: new Date(),
      });

      setApprovedCredentials({ name, email, tempPassword });
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error approving staff:", error);
      }
      alert(error?.message || "Failed to approve staff member. Please try again.");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !userProfile) return;
    const companyId = userProfile.companyId;
    if (!companyId) return;

    setLoading(true);
    // In production, staff are users with the same companyId
    const q = query(collection(db, "users"), where("companyId", "==", companyId));
    
    const unsub = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching staff:", error);
      }
      setLoading(false);
    });

    // Listen to pending staff onboarding applications
    const qPending = query(
      collection(db, "invitations"),
      where("companyId", "==", companyId),
      where("status", "==", "submitted")
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingApplications(apps);
    }, (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching pending applications:", error);
      }
    });

    return () => { unsub(); unsubPending(); };
  }, [user, userProfile, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4 border-b border-gray-50 last:border-0">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const filteredStaff = staff.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Team Governance</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">Staff & Teams</h1>
          <p className="text-gray-500 font-medium text-sm">Managing {staff.length} authorized team members.</p>
        </div>
        
        <button 
          onClick={handleCreateInviteLink}
          disabled={inviting}
          className="flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition disabled:opacity-50 shadow-xl"
        >
          {inviting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          Invite Member
        </button>
      </div>

      {/* Stats & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-gray-200 rounded-xl text-sm font-bold outline-none transition-all"
            />
          </div>
        </div>
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Active Roles</p>
            <p className="text-2xl font-black text-indigo-900">4 Categories</p>
          </div>
          <Shield className="w-8 h-8 text-indigo-200" />
        </div>
      </div>

      {/* Pending Applications */}
      {pendingApplications.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-black text-amber-900">Onboarding Requests ({pendingApplications.length})</h3>
              <p className="text-xs text-amber-700">Staff members waiting for approval</p>
            </div>
          </div>
          <div className="space-y-3">
            {pendingApplications.map((app) => (
              <div key={app.id} className="bg-white rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center text-xs font-black">
                    {app.staffName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "ON"}
                  </div>
                  <div>
                    <p className="font-black text-gray-900">{app.staffName || "Onboarding Candidate"}</p>
                    <p className="text-xs text-gray-500">{app.staffEmail}</p>
                    {app.staffPhone && <p className="text-xs text-gray-400">{app.staffPhone}</p>}
                  </div>
                </div>
                <button
                  onClick={() => { setApprovingStaff(app); setApprovalModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Team Data...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-200" />
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase">No Members Found</h2>
            <p className="text-gray-400 text-sm mt-2">Start building your team by inviting your first manager.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Access Role</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Permissions</th>
                  <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="group hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => router.push(`/vendor/staff/${member.id}`)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-inner">
                          {member.name?.substring(0, 2).toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 tracking-tight">{member.name || "Unnamed User"}</p>
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        member.role === 'car_hire' ? 'bg-primary-50 text-primary-700 border-primary-100' :
                        member.role === 'assistant' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                        {member.role === 'car_hire' ? 'Owner' : member.role?.replace('_', ' ') || 'Member'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Active</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {member.role === 'car_hire_staff' && member.permissions ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(member.permissions).filter(([_, v]) => v).map(([key]) => (
                            <span key={key} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {member.role !== 'car_hire' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteStaff(member.id, member.name); }}
                            className="p-3 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-gray-400"
                            title="Remove Member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); router.push(`/vendor/staff/${member.id}`); }} className="p-3 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400 hover:text-indigo-600">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invitation Share Modal */}
      {inviteUrl && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full border border-gray-100 shadow-2xl space-y-6 relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setInviteUrl(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Link className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900 uppercase">Share Invitation Link</h3>
                <p className="text-gray-500 font-medium text-sm leading-relaxed">
                  Send this single-use link to your team member. Once opened, it will allow them to input their details and register as a staff member in your workspace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <input 
                type="text" 
                readOnly 
                value={inviteUrl} 
                className="bg-transparent border-0 outline-none flex-1 px-3 text-sm font-semibold text-gray-600 select-all"
              />
              <button 
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 ${
                  copied 
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20" 
                    : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs font-bold leading-relaxed">
                Security Warning: This link will expire in 24 hours and is valid for a single registration only. Sharing this link with multiple users may block sign-up attempts.
              </p>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setInviteUrl(null)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-2xl font-black text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal - Allocate Duties */}
      {approvalModalOpen && approvingStaff && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setApprovalModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900">Allocate Duties</h3>
              <button onClick={() => setApprovalModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Configure operational access for <strong>{approvingStaff.staffName || "this user"}</strong>.
            </p>
            <div className="space-y-3">
              {[
                { key: "manageFleet", label: "Manage Fleet", desc: "Add/edit/remove vehicles" },
                { key: "manageYard", label: "Yard Operations", desc: "Receive/release vehicles, log inspections" },
                { key: "manageDrivers", label: "Manage Drivers", desc: "Assign cars, manage chauffeur schedules" },
                { key: "manageMaintenance", label: "Maintenance", desc: "Flag vehicles for service, clear safety holds" },
                { key: "viewFinance", label: "Finance & Ledger", desc: "View revenue and analytics" },
              ].map((perm) => (
                <div key={perm.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{perm.label}</p>
                    <p className="text-xs text-gray-500">{perm.desc}</p>
                  </div>
                  <button
                    onClick={() => setAllocationPermissions(prev => ({ ...prev, [perm.key]: !(prev as any)[perm.key] }))}
                    className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
                      (allocationPermissions as any)[perm.key] ? "bg-indigo-600 justify-end" : "bg-gray-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveStaff}
                className="flex-1 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Approve & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approved Credentials Modal */}
      {approvedCredentials && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setApprovedCredentials(null)} />
          <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-black text-gray-900 text-center mb-2">Staff Approved!</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Share these credentials with <strong>{approvedCredentials.name}</strong>.
            </p>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 mb-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
                <p className="text-sm font-bold text-gray-900">{approvedCredentials.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Temporary Password</p>
                <p className="text-sm font-bold text-gray-900 font-mono bg-white px-3 py-2 rounded-lg border border-gray-200 select-all">
                  {approvedCredentials.tempPassword}
                </p>
              </div>
            </div>
            <p className="text-xs text-amber-600 text-center mb-6">
              The staff member should change this password on first login.
            </p>
            <button
              onClick={() => setApprovedCredentials(null)}
              className="w-full py-3 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-black transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
