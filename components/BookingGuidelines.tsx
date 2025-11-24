import { Shield, CheckCircle, AlertCircle, Eye, Phone, FileText } from "lucide-react";

export default function BookingGuidelines() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
      <div className="text-center mb-8">
        <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Booking Safety Guidelines
        </h2>
        <p className="text-gray-600">
          Important things to consider while booking your ride
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Guideline 1 */}
        <div className="flex gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Verify Car & Driver</h3>
            <p className="text-sm text-gray-700">
              Always confirm the car image and license plate match what's shown on the driver's dashboard and profile.
            </p>
          </div>
        </div>

        {/* Guideline 2 */}
        <div className="flex gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Contact Driver First</h3>
            <p className="text-sm text-gray-700">
              Call or message the driver before pickup to confirm location and any special requirements.
            </p>
          </div>
        </div>

        {/* Guideline 3 */}
        <div className="flex gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Check Driver Rating</h3>
            <p className="text-sm text-gray-700">
              Review the driver's rating and number of completed rides. Higher ratings indicate better service.
            </p>
          </div>
        </div>

        {/* Guideline 4 */}
        <div className="flex gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Share Trip Details</h3>
            <p className="text-sm text-gray-700">
              Share your trip details (driver name, plate number, route) with a friend or family member.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Tips */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Quick Safety Checklist
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Verify the car's make, model, color, and registration plate</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Confirm driver's identity matches their profile photo</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Ensure the driver has an active "ONLINE" status badge</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>Keep your phone charged and accessible during the trip</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span>If something feels wrong, trust your instincts and contact us immediately</span>
          </li>
        </ul>
      </div>

      {/* Emergency Contact */}
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-gray-800 text-center">
          <strong>Need Help?</strong> Contact us anytime: 
          <a href="tel:+254708674665" className="text-red-600 font-bold ml-2 hover:underline">
            +254 708 674 665
          </a>
        </p>
      </div>
    </div>
  );
}
