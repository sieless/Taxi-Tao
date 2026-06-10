import { NextRequest, NextResponse } from 'next/server';
import { requireCompanyOwnership } from "@/lib/auth-server";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { adminDb } from "@/lib/firebase-admin";
import { CompanyIdSchema } from "@/lib/validate";

function escapeCsvCell(value: string): string {
  if (/^[=+\-@\t\r]/.test(value)) {
    return `'${value}'`;
  }
  return `"${value}"`;
}

export async function GET(req: NextRequest) {
  const rateLimitResult = await rateLimitMiddleware(req, "vendor/reports");
  if (rateLimitResult) return rateLimitResult;

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');

  if (!companyId) {
    return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
  }

  const validation = CompanyIdSchema.safeParse({ companyId });
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid Company ID format' }, { status: 400 });
  }

  try {
    await requireCompanyOwnership(companyId);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  try {
    const snapshot = await adminDb.collection("hireRequests")
      .where("companyId", "==", companyId)
      .where("status", "==", "completed")
      .orderBy("completedAt", "desc")
      .get();

    const records: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        date: data.completedAt?.toDate?.()?.toLocaleDateString?.() || 'N/A',
        vehicle: data.vehicleName || 'N/A',
        driver: data.driverName || 'N/A',
        route: data.route || 'N/A',
        revenue: data.totalCost || 0,
        commission: (data.totalCost || 0) * 0.15,
        net: (data.totalCost || 0) * 0.85
      });
    });

    const headers = ['ID', 'Date', 'Vehicle', 'Driver', 'Route', 'Gross Revenue (KSH)', 'System Commission (KSH)', 'Net Settlement (KSH)'];
    const csvRows = [
      headers.join(','),
      ...records.map(r => [
        r.id,
        r.date,
        escapeCsvCell(r.vehicle),
        escapeCsvCell(r.driver),
        escapeCsvCell(r.route),
        r.revenue,
        r.commission,
        r.net
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=TaxiTao_Report_${companyId}_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });

  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
