import { useState } from 'react';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, AlertTriangle, Loader2, Send } from 'lucide-react';

interface ReportIssueModalProps {
  bookingId: string;
  driverId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssueModal({ bookingId, driverId, isOpen, onClose }: ReportIssueModalProps) {
  const [issueType, setIssueType] = useState('safety');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'reports'), {
        bookingId,
        driverId: driverId || null,
        type: issueType,
        description,
        urgency,
        status: 'open',
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setDescription('');
      }, 2000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="font-semibold text-lg text-gray-900">Report an Issue</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-green-600">
                <Send size={32} />
              </div>
              <h4 className="font-bold text-lg">Report Submitted</h4>
              <p className="text-gray-500">We have received your report and will investigate immediately.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">What went wrong?</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none bg-white"
                >
                  <option value="safety">Safety Concern</option>
                  <option value="behavior">Driver Behavior</option>
                  <option value="cleanliness">Vehicle Cleanliness</option>
                  <option value="lost_item">Lost Item</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Urgency Level</label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setUrgency(level)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        urgency === level
                          ? level === 'high' ? 'bg-red-100 text-red-700 border-red-200 border' : 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-black outline-none resize-none h-32"
                  placeholder="Please describe what happened..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !description.trim()}
                className="w-full bg-black text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
