import React, { useState } from 'react';
import { updatePricing } from '../lib/pricing-service';
import { useAuth } from '../lib/auth-context';

interface AddRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRouteModal({ isOpen, onClose }: AddRouteModalProps) {
  const { userProfile } = useAuth();
  const driverId = userProfile?.id || '';
  const [route, setRoute] = useState('');
  const [price, setPrice] = useState('');

  const handleAdd = async () => {
    if (!route || !price) return;
    const priceNum = Number(price);
    const updated = {
      routePricing: { [route]: { price: priceNum } },
    } as any;
    await updatePricing(driverId, updated);
    setRoute('');
    setPrice('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded p-6 w-96 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add New Route Price</h3>
        <input
          placeholder="Route (e.g., Machakos-Masii)"
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          className="border rounded w-full p-2 mb-2"
        />
        <input
          placeholder="Price (KES)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border rounded w-full p-2 mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
