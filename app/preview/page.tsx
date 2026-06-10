'use client';

import Link from 'next/link';
import { Car, FileText, ChevronRight, FlaskConical, Info } from 'lucide-react';

const previews = [
  {
    href: '/preview/vehicles',
    icon: Car,
    label: 'Fleet Management',
    description:
      'Vehicle cards, status metrics, role-gated pricing, detail modal with Overview / Documents / Rental History tabs.',
    roles: ['OWNER', 'FLEET_MANAGER'],
    color: 'indigo',
  },
  {
    href: '/preview/documents',
    icon: FileText,
    label: 'Document Management',
    description:
      'Role-based document visibility, expiry tracking, upload access control, and document detail modal.',
    roles: ['OWNER', 'FLEET_MANAGER', 'FINANCE_MANAGER'],
    color: 'emerald',
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: 'bg-indigo-100 text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  emerald: {
    bg: 'bg-primary-50',
    border: 'border-primary-200',
    icon: 'bg-primary-100 text-primary-700',
    badge: 'bg-primary-100 text-primary-700',
  },
};

export default function PreviewHome() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="flex items-center gap-4 mb-3">
        <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
          <FlaskConical className="w-7 h-7 text-amber-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">UI Preview Sandbox</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Prototype & test new pages before merging into the live Vendor Dashboard
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-10">
        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">How to use this sandbox</p>
          <ul className="space-y-1 text-blue-700 font-medium list-disc list-inside">
            <li>
              Select a <strong>Role</strong> from the top-right dropdown to see role-gated UI
              differences in real time.
            </li>
            <li>All data is dummy data — no Firebase calls, no authentication required.</li>
            <li>
              Once you're happy with a page, the code can be wired into the real{' '}
              <code className="bg-blue-100 px-1 rounded">/vendor/</code> routes.
            </li>
          </ul>
        </div>
      </div>

      {/* Preview cards */}
      <h2 className="text-xs uppercase tracking-widest font-black text-gray-400 mb-4">
        Available Previews
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {previews.map((p) => {
          const c = colorMap[p.color];
          return (
            <Link
              key={p.href}
              href={p.href}
              className={`group block rounded-2xl border-2 ${c.border} ${c.bg} p-6 hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${c.icon} flex items-center justify-center shrink-0`}>
                  <p.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">{p.label}</h3>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition" />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{p.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.roles.map((r) => (
                      <span
                        key={r}
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badge}`}
                      >
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-400 font-medium">
          Preview sandbox lives at{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
            localhost:3000/preview
          </code>{' '}
          · Completely isolated from live routes
        </p>
      </div>
    </div>
  );
}
