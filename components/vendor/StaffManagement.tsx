"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  MoreVertical,
  Mail,
  Phone,
  Trash2,
  Check,
  X,
  Loader2,
  Copy,
  Link,
  Car,
  Wrench,
  DollarSign,
  ClipboardCheck,
  Eye,
  ChevronRight
} from "lucide-react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";


import { logError } from "@/lib/logger";export default function StaffManagement() {
  const { user } = useAuth();
  const router = useRouter();
  const [staff, setStaff] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [approvedCredentials, setApprovedCredentials] = useState<{name: string, email: string, tempPassword: string} | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Define the 5 permissions with icons and labels
  const permissionConfig = [
    { key: "manageFleet" as const, label: "Fleet", icon: Car, color: "blue" },
    { key: "manageYard" as const, label: "Yard", icon: ClipboardCheck, color: "green" },
    { key: "manageDrivers" as const, label: "Drivers", icon: Users, color: "purple" },
    { key: "manageMaintenance" as const, label: "Maint.", icon: Wrench, color: "amber" },
    { key: "viewFinance" as const, label: "Finance", icon: Eye, color: "emerald" },
  ];

  const handleCreateInviteLink = async () => {
    if (!user?.uid) return;
    setInviting(true);
    setCopied(false);
    try {
      const tokenId = crypto.randomUUID();
      const tokenRef = doc(db, "invitations", tokenId);
      
      await setDoc(tokenRef, {
        id: tokenId,
        companyId: user.uid,
        role: "car_hire_staff",
        status: "pending",
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://taxitao.co.ke';
      const url = `${origin}/join?token=${tokenId}`;
      setInviteUrl(url);
    } catch (error) {
      logError("StaffManagement", error);
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

  const handleApproveStaff = async (tokenId: string, name: string, email: string, phone: string) => {
    if (!user?.uid) return;
    try {
      // 1. Generate secure random password
      const characters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
      const randomValues = crypto.getRandomValues(new Uint8Array(8));
      let tempPassword = "";
      for (let i = 0; i < 8; i++) {
        tempPassword += characters.charAt(randomValues[i] % characters.length);
      }

      // 2. Create the user document in /users (making them active in the registry!)
      const userRef = doc(db, "users", tokenId);
      await setDoc(userRef, {
        id: tokenId,
        name: name,
        email: email,
        phone: phone || "",
        role: "car_hire_staff",
        companyId: user.uid,
        permissions: {
          manageFleet: true,
          manageYard: false,
          manageDrivers: true,
          manageMaintenance: false,
          viewFinance: false
        },
        createdAt: new Date()
      });

      // 3. Mark the invitation as approved/used
      const inviteRef = doc(db, "invitations", tokenId);
      await updateDoc(inviteRef, {
        status: "approved",
        usedBy: tokenId,
        usedAt: new Date()
      });

      // 4. Show credentials modal
      setApprovedCredentials({
        name,
        email,
        tempPassword
      });
      setShowApprovalModal(true);

    } catch (error) {
      logError("StaffManagement", error);
      alert("An error occurred while approving this staff member. Please try again.");
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Listen for users who belong to this company and are staff members
    const q = query(
      collection(db, "users"),
      where("companyId", "==", user.uid),
      where("role", "==", "car_hire_staff")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AppUser));
      setStaff(staffData);
      setLoading(false);
    }, (error) => {
      logError("StaffManagement", error);
      setLoading(false);
    });

    // Listen for pending staff onboarding applications
    const qPending = query(
      collection(db, "invitations"),
      where("companyId", "==", user.uid),
      where("status", "==", "submitted")
    );

    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPendingApplications(apps);
    }, (error) => {
      logError("StaffManagement", error);
    });

    return () => {
      unsubscribe();
      unsubPending();
    };
  }, [user?.uid]);

  const togglePermission = async (staffId: string, permission: keyof NonNullable<AppUser["permissions"]>) => {
    try {
      const staffRef = doc(db, "users", staffId);
      const currentStaff = staff.find(s => s.id === staffId);
      if (!currentStaff) return;

      const updatedPermissions = {
        ...(currentStaff.permissions || {}),
        [permission]: !currentStaff.permissions?.[permission]
      };

      await updateDoc(staffRef, {
        permissions: updatedPermissions
      });
    } catch (error) {
      logError("StaffManagement", error);
      alert("Failed to update permissions.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
        <p className="text-gray-500 font-bold mt-4">Syncing staff registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900">Staff Registry</h2>
          <p className="text-gray-500 font-medium text-sm">Manage access levels for your office and operational team.</p>
        </div>
        <button 
          onClick={handleCreateInviteLink}
          disabled={inviting}
          className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-2xl font-black hover:bg-gray-800 transition disabled:opacity-50 shadow-xl shadow-gray-900/10"
        >
          {inviting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserPlus className="w-5 h-5" />
          )}
          Invite Staff
        </button>
      </div>

      {/* Onboarding Applications Section */}
      {pendingApplications.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-violet-600">
            <Users className="w-5 h-5 animate-pulse" />
            <h3 className="text-lg font-black uppercase tracking-wider">Onboarding Requests ({pendingApplications.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {pendingApplications.map((app) => (
              <div key={app.id} className="bg-violet-50/40 border border-violet-100/50 rounded-[2rem] p-6 space-y-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                    {app.staffName?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 text-base leading-tight">{app.staffName || "Onboarding Candidate"}</h4>
                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mt-1">Awaiting Approval</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-semibold text-gray-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> {app.staffEmail}
                  </div>
                  {app.staffPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" /> {app.staffPhone}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleApproveStaff(app.id, app.staffName, app.staffEmail, app.staffPhone)}
                  className="w-full bg-violet-600 hover:bg-violet-750 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg shadow-violet-200 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Approve & Create Credentials
                </button>
              </div>
            ))}
          </div>
          <hr className="border-gray-100 my-6" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {staff.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-16 text-center space-y-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Users className="w-10 h-10 text-gray-300" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-gray-900">No Staff Members Yet</p>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Invite managers and clerks to help you run your fleet operations.
              </p>
            </div>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 space-y-6 hover:shadow-xl transition-all duration-300 group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                    {member.name?.charAt(0) || "S"}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900">{member.name || "Unnamed Staff"}</h3>
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Staff Member
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => router.push(`/vendor/staff/${member.id}`)}
                  className="p-2 hover:bg-gray-50 rounded-xl transition text-gray-400 hover:text-indigo-600"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                  <Mail className="w-4 h-4" /> {member.email}
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <Phone className="w-4 h-4" /> {member.phone}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Functional Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {permissionConfig.map((perm) => {
                    const isEnabled = member.permissions?.[perm.key] || false;
                    return (
                      <button 
                        key={perm.key}
                        onClick={() => togglePermission(member.id, perm.key)}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                          isEnabled 
                            ? `bg-${perm.color}-50 border-${perm.color}-200 text-${perm.color}-700` 
                            : "bg-gray-50 border-gray-100 text-gray-400"
                        }`}
                      >
                        <perm.icon className="w-4 h-4" />
                        <span className="text-[10px] font-black">{perm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] text-gray-400 font-bold italic">
                  Last active: {member.createdAt ? new Date(member.createdAt.toDate()).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invitation Share Modal */}
      {inviteUrl && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full border border-gray-100 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setInviteUrl(null)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600">
                <Link className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-gray-900">Share Invitation Link</h3>
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

      {/* Approval Success Modal */}
      {showApprovalModal && approvedCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full border border-gray-100 shadow-2xl text-center space-y-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowApprovalModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 mx-auto">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900">Onboarding Approved!</h3>
              <p className="text-gray-500 font-semibold text-xs uppercase tracking-wider">Staff Credentials Generated</p>
            </div>

            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              A secure user account has been successfully generated for <span className="font-black text-gray-900">{approvedCredentials.name}</span>. An automated credentials notification email has been dispatched.
            </p>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-left space-y-4">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email Address</label>
                <p className="text-sm font-black text-gray-800">{approvedCredentials.email}</p>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Temporary Password</label>
                <p className="text-sm font-black text-violet-600 tracking-wider font-mono bg-violet-50/50 px-3 py-2 rounded-lg border border-violet-100/50 inline-block">{approvedCredentials.tempPassword}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => {
                  const credentialsText = `Taxi-Tao Staff Login Credentials:\nEmail: ${approvedCredentials.email}\nTemporary Password: ${approvedCredentials.tempPassword}\n\nPlease download the Taxi-Tao app to sign in.`;
                  navigator.clipboard.writeText(credentialsText);
                  alert("Credentials copied to clipboard!");
                }}
                className="flex-1 bg-violet-600 hover:bg-violet-750 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-violet-200"
              >
                Copy Details
              </button>
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
