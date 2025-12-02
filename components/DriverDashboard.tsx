"use client";

import { useState } from 'react';
import { Loader2, X, Upload, Car } from 'lucide-react';

interface DriverDashboardProps {
  driver: any; // Replace with proper driver type if available
}

export default function DriverDashboard({ driver }: DriverDashboardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCarImage, setSelectedCarImage] = useState<File | null>(null);
  const [carPreviewUrl, setCarPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editForm, setEditForm] = useState({
    phone: driver?.phone || '',
    businessLocation: driver?.businessLocation || '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    make: driver?.vehicle?.make || '',
    model: driver?.vehicle?.model || '',
    year: driver?.vehicle?.year || '',
    plate: driver?.vehicle?.plate || '',
    color: driver?.vehicle?.color || '',
    type: driver?.vehicle?.type || 'sedan',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCarImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCarImage(file);
      setCarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: implement saving profile info
      console.log('Profile updated', editForm, selectedImage);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // TODO: implement saving vehicle info
      console.log('Vehicle updated', vehicleForm, selectedCarImage);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setIsEditing(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg"
      >
        Edit Profile
      </button>

      <button
        onClick={() => setIsEditingVehicle(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg ml-2"
      >
        Edit Vehicle
      </button>

      {/* Profile Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Profile</h3>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                    {previewUrl || driver?.profilePhotoUrl ? (
                      <img
                        src={previewUrl || driver?.profilePhotoUrl}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Location</label>
                  <input
                    type="text"
                    value={editForm.businessLocation}
                    onChange={(e) => setEditForm({ ...editForm, businessLocation: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Nairobi CBD"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Edit Modal */}
      {isEditingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">Edit Vehicle Information</h3>
              <button
                onClick={() => {
                  setIsEditingVehicle(false);
                  setSelectedCarImage(null);
                  setCarPreviewUrl(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                {/* Car Photo Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative bg-gray-50">
                    {carPreviewUrl || driver?.vehicle?.carPhotoUrl ? (
                      <img
                        src={carPreviewUrl || driver?.vehicle?.carPhotoUrl}
                        alt="Car Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Car className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Change Car Photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleCarImageSelect} />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                    <input
                      type="text"
                      value={vehicleForm.make}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Toyota"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={vehicleForm.model}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., Corolla"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="text"
                      value={vehicleForm.year}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., 2020"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                    <input
                      type="text"
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., KAA 123B"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={vehicleForm.color}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., White"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                    <select
                      value={vehicleForm.type}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="van">Van</option>
                      <option value="bike">Bike</option>
                      <option value="tuk-tuk">Tuk-Tuk</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingVehicle(false);
                      setSelectedCarImage(null);
                      setCarPreviewUrl(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving || uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
