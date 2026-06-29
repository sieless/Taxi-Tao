"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink, Smartphone, Download, Copy } from "lucide-react";

function isProbablyMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

export default function RideShareHandoffPage() {
  const params = useParams();
  const shareId = String(params.shareId || "");

  const deepLink = useMemo(() => `taxitao://ride/${encodeURIComponent(shareId)}`, [shareId]);
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.taxitao.mobile";
  const downloadPageUrl = "/download";
  const webUrl = useMemo(() => `https://taxitao.co.ke/ride/${encodeURIComponent(shareId)}`, [shareId]);

  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [autoAttempted, setAutoAttempted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function buildQr() {
      try {
        const QRCode = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(webUrl, {
          margin: 1,
          width: 220,
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(dataUrl);
      } catch {
        // Non-fatal: QR is a convenience.
      }
    }

    if (shareId) buildQr();
    return () => {
      cancelled = true;
    };
  }, [shareId, webUrl]);

  useEffect(() => {
    if (!shareId) return;
    if (!isProbablyMobileBrowser()) return;
    if (autoAttempted) return;

    setAutoAttempted(true);

    // Best-effort handoff: if the app is installed the OS will open it.
    // If not installed, the browser will stay here and the user can use the download buttons.
    const t = window.setTimeout(() => {
      window.location.href = deepLink;
    }, 150);

    return () => window.clearTimeout(t);
  }, [autoAttempted, deepLink, shareId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(webUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900">Open This Ride In TaxiTao</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ride claiming happens inside the TaxiTao mobile app.
            </p>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={deepLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 font-semibold hover:bg-emerald-700 transition"
              >
                <Smartphone size={18} />
                Open In App
              </a>
              <a
                href={playStoreUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 font-semibold hover:bg-slate-800 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={18} />
                Get Android App
              </a>
              <a
                href={downloadPageUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <ExternalLink size={18} />
                Download Options
              </a>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Link</p>
                <p className="text-sm font-mono text-slate-800 truncate">{webUrl}</p>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-2 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Copy size={16} />
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {qrDataUrl ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  <img
                    src={qrDataUrl}
                    alt="QR code to open this ride link"
                    className="w-[220px] h-[220px] bg-white border border-slate-200 rounded-xl"
                  />
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-slate-900">On Desktop?</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Scan this QR code with your phone to open the ride link, then claim it in the TaxiTao app.
                    </p>
                    <p className="text-sm text-slate-600 mt-3">
                      If the app doesn’t open automatically, use the “Open In App” button after installing.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

