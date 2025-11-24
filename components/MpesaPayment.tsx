"use client";

import { CreditCard, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MpesaPayment() {
  const [copied, setCopied] = useState<string | null>(null);

  const tillNumber = "7323090";
  const accountName = "Titus Kipkirui";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg overflow-hidden border border-green-200">
      <div className="bg-green-600 text-white p-4 flex items-center gap-3">
        <CreditCard className="w-6 h-6" />
        <h3 className="text-xl font-bold">M-Pesa Payment</h3>
      </div>

      <div className="p-6 space-y-6">
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <p className="text-gray-700 mb-4 text-sm">
            To complete your payment, please send money via M-Pesa to the following details:
          </p>

          <div className="space-y-4">
            {/* Till Number */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Till Number
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-bold text-green-700 tracking-wider">
                  {tillNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(tillNumber, "till")}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                >
                  {copied === "till" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Name
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xl font-semibold text-gray-800">
                  {accountName}
                </span>
                <button
                  onClick={() => copyToClipboard(accountName, "account")}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                >
                  {copied === "account" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <span className="text-lg">📱</span> How to Pay via M-Pesa
          </h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to M-Pesa on your phone</li>
            <li>Select "Lipa na M-Pesa"</li>
            <li>Select "Buy Goods and Services"</li>
            <li>Enter Till Number: <strong>{tillNumber}</strong></li>
            <li>Enter the amount</li>
            <li>Enter your M-Pesa PIN and confirm</li>
          </ol>
        </div>

        {/* Confirmation Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> After payment, please contact us via WhatsApp or call to confirm your booking with the M-Pesa transaction code.
          </p>
        </div>
      </div>
    </div>
  );
}
