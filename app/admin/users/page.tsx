"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Shield, User } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: any;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "customer" | "driver" | "admin">("all");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      setUsers(usersList);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = filter === "all" 
    ? users 
    : users.filter(u => u.role === filter);

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: "bg-purple-100 text-purple-800",
      driver: "bg-green-100 text-green-800",
      customer: "bg-blue-100 text-blue-800",
    };
    return styles[role as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield size={16} />;
    if (role === "driver") return <Users size={16} />;
    return <User size={16} />;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Users Management</h1>
          <p className="text-gray-600">Manage all system users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Users", count: users.length, color: "blue" },
            { label: "Customers", count: users.filter(u => u.role === "customer").length, color: "green" },
            { label: "Drivers", count: users.filter(u => u.role === "driver").length, color: "yellow" },
            { label: "Admins", count: users.filter(u => u.role === "admin").length, color: "purple" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            {["all", "customer", "driver", "admin"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === f
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getRoleIcon(user.role)}
                      <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>📧 {user.email}</p>
                      <p>📱 {user.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
