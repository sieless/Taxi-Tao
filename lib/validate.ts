/**
 * Request validation utilities using Zod.
 *
 * This module provides helpers to validate API request bodies, query params,
 * and URL params using Zod schemas. All validation happens server-side.
 *
 * SECURITY: Never trust client input. Always validate on the server.
 */
import { z, ZodSchema } from "zod";
import { NextRequest, NextResponse } from "next/server";

/**
 * Validate a request body against a Zod schema.
 * Returns the validated data or an error response.
 */
export async function validateBody<T extends ZodSchema>(
  request: NextRequest,
  schema: T
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Validation failed" },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema.
 */
export function validateQuery<T extends ZodSchema>(
  request: NextRequest,
  schema: T
):
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse } {
  try {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const result = schema.safeParse(searchParams);

    if (!result.success) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Invalid query parameters" },
          { status: 400 }
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Failed to parse query parameters" },
        { status: 400 }
      ),
    };
  }
}

// ============ COMMON VALIDATION SCHEMAS ============

/**
 * Pagination schema for list endpoints.
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/**
 * Company ID schema.
 */
export const CompanyIdSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
});

/**
 * Hire request ID schema.
 */
export const HireRequestIdSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
});

/**
 * Hire request approval schema.
 */
export const HireRequestApproveSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  companyId: z.string().min(1, "Company ID is required"),
});

/**
 * Hire request rejection schema.
 */
export const HireRequestRejectSchema = z.object({
  requestId: z.string().min(1, "Request ID is required"),
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

/**
 * Staff permissions update schema.
 */
export const StaffPermissionsSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  permissions: z.record(z.string(), z.boolean()),
});

/**
 * Payment confirmation schema.
 */
export const PaymentConfirmSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  notes: z.string().max(500).optional(),
});

/**
 * Payment rejection schema.
 */
export const PaymentRejectSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  reason: z.string().min(1, "Rejection reason is required").max(500),
});

/**
 * Email send schema.
 */
export const SendEmailSchema = z.object({
  to: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  html: z.string().min(1, "Email body is required").max(10000),
});

/**
 * Staff invite schema.
 */
export const StaffInviteSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  email: z.string().email("Invalid email address").optional(),
});

/**
 * Vehicle creation schema.
 */
export const VehicleCreateSchema = z.object({
  make: z.string().min(1, "Make is required").max(100),
  model: z.string().min(1, "Model is required").max(100),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  plate: z.string().min(1, "Plate number is required").max(20),
  type: z.enum(["sedan", "suv", "van", "bike", "tuk-tuk"]),
  seats: z.number().int().min(1).max(50),
  dailyRate: z.number().min(0, "Daily rate must be non-negative"),
  securityDeposit: z.number().min(0, "Security deposit must be non-negative"),
  color: z.string().max(50).optional(),
  vin: z.string().max(17).optional(),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
  transmissionType: z.enum(["automatic", "manual"]).optional(),
  description: z.string().max(1000).optional(),
  images: z.array(z.string().url()).min(3).max(6),
});

/**
 * Hire request creation schema.
 */
export const HireRequestCreateSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  startDateIso: z.string().datetime("Invalid start date"),
  endDateIso: z.string().datetime("Invalid end date"),
  durationDays: z.number().int().min(1, "Duration must be at least 1 day"),
  durationHours: z.number().int().min(0).max(23).optional(),
  handoverMode: z.enum(["pickup", "delivery"]),
  driverMode: z.enum(["self", "chauffeur"]),
  deliveryAddress: z.string().max(300).optional(),
  deliveryCoords: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
});

/**
 * Inspection record schema.
 */
export const InspectionRecordSchema = z.object({
  status: z.enum(["pending", "in_progress", "complete"]),
  fuelLevel: z
    .enum(["empty", "quarter", "half", "three_quarter", "full"])
    .optional(),
  odometerReading: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  damageReported: z.boolean().optional(),
  damageNotes: z.string().max(1000).optional(),
  checks: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      category: z.enum(["exterior", "interior", "mechanical", "documents"]),
      type: z.enum(["checkbox", "text"]),
      enabled: z.boolean(),
      checked: z.boolean().optional(),
      value: z.string().optional(),
    })
  ),
});
