"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Driver } from "@/lib/types";
import { CreditCard, Save, Loader2 } from "lucide-react";

interface MpesaSettingsProps {
  driver: Driver;
  onUpdate: (updatedDriver: Driver) => void;
}

export default function MpesaSettings({ driver, onUpdate }: MpesaSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentType, setPaymentType] = useState<'till' | 'paybill' | 'send_money'>(
    driver.mpesaDetails?.type || 'till'
  );
  
  const [tillNumber, setTillNumber] = useState(driver.mpesaDetails?.tillNumber || '');
  const [paybillNumber, setPaybillNumber] = useState(driver.mpesaDetails?.paybillNumber || '');
  const [accountNumber, setAccountNumber] = useState(driver.mpesaDetails?.accountNumber || '');
  const [phoneNumber, setPhoneNumber] = useState(driver.mpesaDetails?.phoneNumber || '');

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    
    try {
      const driverRef = doc(db, "drivers", driver.id);
      
      const mpesaDetails: Driver['mpesaDetails'] = {
        type: paymentType,
        ...(paymentType === 'till' && { tillNumber }),
        ...(paymentType === 'paybill' && { paybillNumber, accountNumber }),
        ...(paymentType === 'send_money' && { phoneNumber }),
      };
      
      await updateDoc(driverRef, { mpesaDetails });
      
      // Update local state
      onUpdate({ ...driver, mpesaDetails });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving M-Pesa details:", error);
      alert("Failed to save M-Pesa details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">M-Pesa Payment Details</h3>
          <p className="text-sm text-gray-500">Set up your payment information for customers</p>
        </div>
      </div>

      {/* Payment Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Type
        </label>
        <div className="grid grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setPaymentType('till')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentType === 'till'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Till Number</div>
            <div className="text-xs text-gray-500 mt-1">For business tills</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('paybill')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentType === 'paybill'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Paybill</div>
            <div className="text-xs text-gray-500 mt-1">For paybill accounts</div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentType('send_money')}
            className={`p-4 rounded-lg border-2 transition-all ${
              paymentType === 'send_money'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-900">Send Money</div>
            <div className="text-xs text-gray-500 mt-1">To phone number</div>
          </button>
        </div>
      </div>

      {/* Till Number Fields */}
      {paymentType === 'till' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Till Number *
            </label>
            <input
              type="text"
              value={tillNumber}
              onChange={(e) => setTillNumber(e.target.value)}
              placeholder="Enter your Till Number"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer flow: Amount → Pay
            </p>
          </div>
        </div>
      )}

      {/* Paybill Fields */}
      {paymentType === 'paybill' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paybill Number *
            </label>
            <input
              type="text"
              value={paybillNumber}
              onChange={(e) => setPaybillNumber(e.target.value)}
              placeholder="Enter Paybill Number"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number *
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter Account Number"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer flow: Paybill → Account → Amount → Pay
            </p>
          </div>
        </div>
      )}

      {/* Send Money Fields */}
      {paymentType === 'send_money' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 0712345678"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Customer flow: Send Money → Phone Number → Amount
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || (paymentType === 'till' ? !tillNumber : paymentType === 'paybill' ? (!paybillNumber || !accountNumber) : !phoneNumber)}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Payment Details
            </>
          )}
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          ✓ Payment details saved successfully!
        </div>
      )}
    </div>
  );
}
