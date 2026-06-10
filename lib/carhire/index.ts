/**
 * Car Hire Services
 *
 * Barrel export for all car hire services.
 * Import from this file for convenient access to all services.
 */

// Hire Request Service
export {
  DEFAULT_INSPECTION_TEMPLATE,
  subscribeToCompanyRequests,
  subscribeToCustomerRequests,
  subscribeToActiveRental,
  subscribeToPendingHireIndicator,
  updateHireRequestStatus,
  rejectHireRequest,
  saveInspectionRecord,
  approveHireWithHandshake,
  completeRentalHandshake,
  subscribeToGlobalHireRequests,
} from "./hire-request-service";

// Hire Payment Service
export {
  extractMpesaCode,
  extractMpesaAmount,
  parseMpesaMessage,
  subscribeToHirePayments,
  getHirePaymentSummary,
  confirmPaymentReceipt,
  rejectHirePayment,
  generateHireReceipt,
} from "./hire-payment-service";

// Vehicle Management Service
export {
  getFleetByCompany,
  getGlobalFleet,
  getVehicleDetail,
  saveVehicleDraft,
  deleteVehicleAsset,
  batchActivateFleet,
  searchActiveFleet,
} from "./vehicle-management-service";

// Company Service
export {
  getCompanyByRep,
  getCompanyDetail,
  getActiveCompanies,
  getCorporateCompanies,
  getGlobalHireSubscriptions,
  createCompanyProfile,
  updateCompanyProfile,
  updateFleetCount,
  saveCompanySettings,
  saveInspectionTemplate,
} from "./company-service";

// Staff Activity Service
export {
  getCategoryConfig,
  subscribeToStaffActivityLogs,
  subscribeToCompanyActivityLogs,
  logStaffActivity,
  logFleetAction,
  logInspectionAction,
  logPermissionAction,
  logOperationAction,
  logSessionAction,
} from "./staff-activity-service";

// Partner Context
export { PartnerProvider, usePartner } from "./partner-context";

// Rental Timer Utilities
export {
  calculateRentalTimer,
  formatDuration,
  getRentalStatusColor,
  getRentalStatusLabel,
} from "./rental-timer-utils";
