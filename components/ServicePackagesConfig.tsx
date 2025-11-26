import React, { useState, useEffect } from 'react';
import { getDriverPricing, updatePricing } from '../lib/pricing-service';
import { useAuth } from '../lib/auth-context';

type PackageType = 'hourlyHire' | 'longDistance' | 'specialServices';

export default function ServicePackagesConfig() {
  const { userProfile } = useAuth();
  const driverId = userProfile?.driverId || '';
  const [packages, setPackages] = useState<any>({});
  const [selectedPackage, setSelectedPackage] = useState<PackageType>('hourlyHire');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!driverId) return;
    getDriverPricing(driverId).then((data) => {
      setPackages(data?.packages || {});
    });
  }, [driverId]);

  const handleAdd = async () => {
    if (!driverId) {
      alert('Driver ID not found. Please refresh the page.');
      return;
    }
    if (!key) return;
    let updated = {} as any;
    if (selectedPackage === 'hourlyHire') {
      updated = { packages: { hourlyHire: { ...packages?.hourlyHire, [key]: Number(value) } } };
    } else if (selectedPackage === 'longDistance') {
      updated = { packages: { longDistance: { ...packages?.longDistance, [key]: Number(value) } } };
    } else {
      updated = { packages: { specialServices: { ...packages?.specialServices, [key]: Number(value) } } };
    }
    await updatePricing(driverId, updated);
    setPackages({ ...packages, [selectedPackage]: { ...packages[selectedPackage], [key]: Number(value) } });
    setKey('');
    setValue('');
  };

  const renderPackage = () => {
    const pkg = packages?.[selectedPackage] || {};
    return Object.entries(pkg).map(([k, v]) => (
      <li key={k} className="flex justify-between items-center py-1">
        <span>{k}: {String(v)} KES</span>
      </li>
    ));
  };

  return (
    <div className="p-4 bg-white rounded shadow mt-6">
      <h3 className="text-lg font-bold mb-4">Service Packages Configuration</h3>
      <select
        value={selectedPackage}
        onChange={(e) => setSelectedPackage(e.target.value as PackageType)}
        className="border rounded p-1 mb-4"
      >
        <option value="hourlyHire">Hourly Hire</option>
        <option value="longDistance">Long Distance</option>
        <option value="specialServices">Special Services</option>
      </select>
      <ul className="mb-4">{renderPackage()}</ul>
      <div className="flex space-x-2">
        <input
          placeholder={selectedPackage === 'hourlyHire' ? 'Label (e.g., halfDay)' : 'Route or Service'}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="border rounded p-1 flex-1"
        />
        <input
          placeholder="Price (KES)"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="border rounded p-1 w-24"
        />
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >Add</button>
      </div>
    </div>
  );
}
