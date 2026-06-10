"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Search, 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MoreVertical, 
  Ban, 
  CheckCircle2, 
  UserPlus,
  Filter,
  Users as UsersIcon
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useModal } from "@/lib/admin-modal-context";
import { hasAdminPermission } from "@/lib/admin-permission-helper";
import { useAuth } from "@/lib/auth-context";
import { suspendUser, unsuspendUser } from "@/lib/admin-user-service";
import { Copy, UserCircle, ShieldAlert } from "lucide-react";


import { logError } from "@/lib/logger";interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "driver" | "admin" | "assistant";
  isSuspended?: boolean;
  createdAt: any;
}

export default function UsersTab() {
  const { userProfile: adminProfile } = useAuth();
  const modal = useModal();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const canManage = hasAdminPermission(adminProfile, "manageUsers");

  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";

  useEffect(() => {
    loadUsers();
  }, [roleFilter, search]);

  async function loadUsers() {
    setLoading(true);
    try {
      let q;
      
      if (search) {
        // Database-level prefix search
        const searchTerm = search.charAt(0).toUpperCase() + search.slice(1);
        q = query(
          collection(db, "users"),
          where("name", ">=", searchTerm),
          where("name", "<=", searchTerm + "\uf8ff"),
          limit(50)
        );
      } else {
        q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
        if (roleFilter !== "all") {
          q = query(collection(db, "users"), where("role", "==", roleFilter), orderBy("createdAt", "desc"), limit(50));
        }
      }

      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    } catch (err) {
      logError("UsersTab", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSuspend = async (user: UserProfile) => {
    const ok = await modal.showConfirm(`Suspend account for ${user.name}? They will lose all access immediately.`, "Suspend User", "Suspend");
    if (!ok) return;
    setActing(user.id);
    try {
      await suspendUser(user.id, user.email, adminProfile?.id || "admin");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isSuspended: true } : u));
      modal.showAlert("User suspended successfully", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  };

  const handleUnsuspend = async (user: UserProfile) => {
    const ok = await modal.showConfirm(`Restore access for ${user.name}?`, "Unsuspend User", "Restore");
    if (!ok) return;
    setActing(user.id);
    try {
      await unsuspendUser(user.id, adminProfile?.id || "admin");
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isSuspended: false } : u));
      modal.showAlert("User access restored", "success");
    } catch (err: any) {
      modal.showAlert(`Failed: ${err.message}`, "error");
    } finally {
      setActing(null);
      setActiveMenu(null);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    modal.showAlert("ID copied to clipboard", "info");
    setActiveMenu(null);
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: "bg-rose-100 text-rose-700 border-rose-200",
      assistant: "bg-amber-100 text-amber-700 border-amber-200",
      driver: "bg-indigo-100 text-indigo-700 border-indigo-200",
      customer: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return styles[role] || styles.customer;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <UsersIcon size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Active Users</p>
            <p className="text-xl font-bold text-slate-900">{users.length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Filter size={16} className="text-slate-400" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers</option>
            <option value="driver">Drivers</option>
            <option value="admin">Admins</option>
            <option value="assistant">Assistants</option>
          </select>
          {canManage && (
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-indigo-200">
              <UserPlus size={16} />
              <span className="hidden sm:inline">Add User</span>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 italic">No users found matching your criteria</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold">
                          {user.name?.charAt(0) || <User size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail size={12} className="text-slate-400" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={12} className="text-slate-400" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${getRoleBadge(user.role)}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isSuspended ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <Ban size={14} /> Suspended
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu === user.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                          <div className="absolute right-6 top-12 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 animate-in fade-in zoom-in-95 duration-200">
                            <button 
                              onClick={() => copyId(user.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                              <Copy size={14} /> Copy ID
                            </button>
                            <div className="h-px bg-slate-50 my-1" />
                            {user.isSuspended ? (
                              <button 
                                onClick={() => handleUnsuspend(user)}
                                disabled={acting === user.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-bold"
                              >
                                <CheckCircle2 size={14} /> Unsuspend Account
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleSuspend(user)}
                                disabled={acting === user.id}
                                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors font-bold"
                              >
                                <Ban size={14} /> Suspend Account
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
