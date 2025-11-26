"use client";

import { Driver, ComplianceAlert } from '@/lib/types';
import { AlertTriangle, Shield, FileText, Calendar } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

interface ComplianceAlertsProps {
  driver: Driver;
}

export default function ComplianceAlerts({ driver }: ComplianceAlertsProps) {
  const alerts: ComplianceAlert[] = [];

  // Check insurance expiry
  if (driver.insuranceExpiry) {
    const insuranceDate = driver.insuranceExpiry instanceof Timestamp ? driver.insuranceExpiry.toDate() : new Date(driver.insuranceExpiry);
    const daysUntil = getDaysUntilExpiry(insuranceDate);
    
    if (daysUntil <= 30) {
      alerts.push({
        type: 'insurance',
        expiryDate: driver.insuranceExpiry,
        daysUntilExpiry: daysUntil,
        severity: daysUntil <= 7 ? 'critical' : daysUntil <= 14 ? 'warning' : 'info'
      });
    }
  }

  // Check license expiry
  if (driver.licenseExpiry) {
    const licenseDate = driver.licenseExpiry instanceof Timestamp ? driver.licenseExpiry.toDate() : new Date(driver.licenseExpiry);
    const daysUntil = getDaysUntilExpiry(licenseDate);
    
    if (daysUntil <= 60) {
      alerts.push({
        type: 'license',
        expiryDate: driver.licenseExpiry,
        daysUntilExpiry: daysUntil,
        severity: daysUntil <= 14 ? 'critical' : daysUntil <= 30 ? 'warning' : 'info'
      });
    }
  }

  // Check vehicle inspection
  if (driver.vehicleInspectionDue) {
    const inspectionDate = driver.vehicleInspectionDue instanceof Timestamp ? driver.vehicleInspectionDue.toDate() : new Date(driver.vehicleInspectionDue);
    const daysUntil = getDaysUntilExpiry(inspectionDate);
    
    if (daysUntil <= 30) {
      alerts.push({
        type: 'inspection',
        expiryDate: driver.vehicleInspectionDue,
        daysUntilExpiry: daysUntil,
        severity: daysUntil <= 7 ? 'critical' : daysUntil <= 14 ? 'warning' : 'info'
      });
    }
  }

  function getDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getAlertColor(severity: string) {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  }

  function getAlertIcon(type: string) {
    switch (type) {
      case 'insurance':
        return <Shield className="w-5 h-5" />;
      case 'license':
        return <FileText className="w-5 h-5" />;
      case 'inspection':
        return <Calendar className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  }

  function getAlertTitle(type: string) {
    switch (type) {
      case 'insurance':
        return 'Insurance Expiry';
      case 'license':
        return 'License Renewal';
      case 'inspection':
        return 'Vehicle Inspection';
      default:
        return 'Compliance Alert';
    }
  }

  function getAlertMessage(alert: ComplianceAlert) {
    const expiryDate = alert.expiryDate instanceof Timestamp ? alert.expiryDate.toDate() : new Date(alert.expiryDate);
    const dateStr = expiryDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (alert.daysUntilExpiry < 0) {
      return `Expired on ${dateStr}`;
    } else if (alert.daysUntilExpiry === 0) {
      return `Expires today!`;
    } else if (alert.daysUntilExpiry === 1) {
      return `Expires tomorrow (${dateStr})`;
    } else {
      return `Expires in ${alert.daysUntilExpiry} days (${dateStr})`;
    }
  }

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        Compliance Alerts
      </h3>
      
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 ${getAlertColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">
                  {getAlertTitle(alert.type)}
                </p>
                <p className="text-sm">
                  {getAlertMessage(alert)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
