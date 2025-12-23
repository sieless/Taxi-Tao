"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Filter, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  XCircle,
  Loader2
} from "lucide-react";

interface TestingFeedback {
  id: string;
  userId: string;
  userRole: "driver" | "customer" | "admin";
  userName: string;
  userEmail: string;
  userPhone?: string;
  title: string;
  description: string;
  category: "bug" | "feature" | "ui" | "performance" | "other";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in-progress" | "resolved" | "closed";
  screenshots: string[];
  adminComments: Array<{
    adminId: string;
    adminName: string;
    comment: string;
    timestamp: Timestamp;
  }>;
  responses: Array<{
    userId: string;
    userName: string;
    message: string;
    timestamp: Timestamp;
  }>;
  deviceInfo: {
    platform: string;
    model: string;
    osVersion: string;
    appVersion: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function AdminTestingFeedback() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [feedback, setFeedback] = useState<TestingFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<TestingFeedback | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (userProfile?.role !== "admin") {
      router.push("/");
      return;
    }

    // Real-time listener for feedback
    const q = query(
      collection(db, "testingFeedback"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TestingFeedback[];
      setFeedback(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, userProfile, router]);

  const handleStatusChange = async (feedbackId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "testingFeedback", feedbackId), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const handleAddComment = async () => {
    if (!selectedFeedback || !adminComment.trim() || !user) return;

    setSubmittingComment(true);
    try {
      const newComment = {
        adminId: user.uid,
        adminName: userProfile?.name || "Admin",
        comment: adminComment,
        timestamp: Timestamp.now(),
      };

      await updateDoc(doc(db, "testingFeedback", selectedFeedback.id), {
        adminComments: [...(selectedFeedback.adminComments || []), newComment],
        updatedAt: Timestamp.now(),
      });

      setAdminComment("");
      alert("Comment added successfully!");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const exportToMarkdown = () => {
    let markdown = "# Testing Feedback Report\n\n";
    markdown += `Generated: ${new Date().toLocaleString()}\n\n`;
    markdown += `Total Feedback: ${filteredFeedback.length}\n\n---\n\n`;

    filteredFeedback.forEach((item, index) => {
      markdown += `## ${index + 1}. ${item.title}\n\n`;
      markdown += `- **User**: ${item.userName} (${item.userRole})\n`;
      markdown += `- **Priority**: ${item.priority.toUpperCase()}\n`;
      markdown += `- **Status**: ${item.status}\n`;
      markdown += `- **Category**: ${item.category}\n`;
      markdown += `- **Device**: ${item.deviceInfo.model} (${item.deviceInfo.osVersion})\n`;
      markdown += `- **Submitted**: ${item.createdAt.toDate().toLocaleString()}\n\n`;
      markdown += `**Description**:\n${item.description}\n\n`;
      
      if (item.adminComments && item.adminComments.length > 0) {
        markdown += `**Admin Comments**:\n`;
        item.adminComments.forEach((comment) => {
          markdown += `- ${comment.adminName}: ${comment.comment}\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-report-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
  };

  const filteredFeedback = feedback.filter((item) => {
    if (roleFilter !== "all" && item.userRole !== roleFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <Clock className="w-4 h-4" />;
      case "in-progress": return <AlertTriangle className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Testing Feedback</h1>
              <p className="text-gray-600 mt-1">
                Manage and respond to user feedback from the testing phase
              </p>
            </div>
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              <Download className="w-4 h-4" />
              Export to .md
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-bold text-gray-800">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">All Roles</option>
                <option value="driver">Drivers</option>
                <option value="customer">Customers</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedback.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <span className="text-sm text-gray-700 capitalize">{item.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 capitalize">{item.userRole}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.userName}</div>
                      <div className="text-xs text-gray-500">{item.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.createdAt.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="text-green-600 hover:text-green-700 font-semibold text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredFeedback.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No feedback found matching the selected filters.
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedFeedback.title}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(selectedFeedback.priority)}`}>
                        {selectedFeedback.priority.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">by {selectedFeedback.userName}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFeedback(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {/* Device Info */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Device Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Model:</strong> {selectedFeedback.deviceInfo.model}</div>
                      <div><strong>OS:</strong> {selectedFeedback.deviceInfo.osVersion}</div>
                      <div><strong>Platform:</strong> {selectedFeedback.deviceInfo.platform}</div>
                      <div><strong>App Version:</strong> {selectedFeedback.deviceInfo.appVersion}</div>
                    </div>
                  </div>
                </div>

                {/* Status Change */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Change Status</h3>
                  <div className="flex gap-2">
                    {["open", "in-progress", "resolved", "closed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedFeedback.id, status)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                          selectedFeedback.status === status
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin Comments */}
                <div>
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Admin Comments
                  </h3>
                  <div className="space-y-3 mb-4">
                    {selectedFeedback.adminComments?.map((comment, index) => (
                      <div key={index} className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm text-blue-900">{comment.adminName}</span>
                          <span className="text-xs text-blue-600">
                            {comment.timestamp.toDate().toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-blue-800">{comment.comment}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={submittingComment || !adminComment.trim()}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {submittingComment ? "Adding..." : "Add Comment"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
