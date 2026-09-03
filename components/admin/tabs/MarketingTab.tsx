"use client";

import { useEffect, useState, useCallback } from "react";
import {
  QrCode,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Smartphone,
  Printer,
  Image as ImageIcon,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────
// Single source of truth for the Play Store URL.
// When the app graduates from Internal Testing to Production, update this one value.
// RECOMMENDED: Point this to https://taxitao.co.ke/app (a server-side redirect) so
// that any printed stickers never become invalid if the Play Store URL changes.
const APP_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.taxitao.mobile";

type ExportFormat = "svg" | "png";
type StickerStyle = "raw_qr" | "branded_sticker";

const STICKER_STYLES: Record<StickerStyle, { label: string; description: string }> = {
  raw_qr: {
    label: "Raw QR Code",
    description: "Plain high-res QR code with TaxiTao logo — ideal for embedding into your own designs.",
  },
  branded_sticker: {
    label: "Branded Marketing Sticker",
    description: 'Full sticker with TaxiTao branding and "Scan to Download" — ready to print.',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function generateQRBase64(text: string, logoUrl = "/icon.png"): Promise<string> {
  // Dynamic import keeps this out of the SSR bundle (qrcode uses Canvas/Node APIs)
  const QRCode = await import("qrcode");
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;

  await QRCode.toCanvas(canvas, text, {
    width: 800,
    margin: 2,
    errorCorrectionLevel: "H", // High error correction (30%) allows clean center logo badge
    color: { dark: "#000000", light: "#ffffff" },
  });

  const ctx = canvas.getContext("2d");
  if (ctx && logoUrl) {
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.src = logoUrl;
      await new Promise<void>((resolve) => {
        logoImg.onload = () => resolve();
        logoImg.onerror = () => resolve();
        setTimeout(resolve, 2500);
      });

      if (logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 160; // 20% of canvas width
        const x = (800 - logoSize) / 2;
        const y = (800 - logoSize) / 2;

        // Draw clean rounded white background badge for contrast
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        if (typeof (ctx as any).roundRect === "function") {
          (ctx as any).roundRect(x - 12, y - 12, logoSize + 24, logoSize + 24, 24);
        } else {
          ctx.rect(x - 12, y - 12, logoSize + 24, logoSize + 24);
        }
        ctx.fill();

        // Subtle green accent border around logo badge
        ctx.strokeStyle = "#16a34a";
        ctx.lineWidth = 6;
        ctx.stroke();

        // Draw logo
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
      }
    } catch (e) {
      // Fall back to clean QR code if logo fails
    }
  }

  return canvas.toDataURL("image/png");
}

/** Generates the SVG string for the Raw QR template (just the QR + tiny brand text) */
function buildRawQrSvg(qrBase64: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="900" height="960" viewBox="0 0 900 960">
  <rect width="900" height="960" fill="#ffffff"/>
  <!-- QR Code -->
  <image xlink:href="${qrBase64}" x="50" y="50" width="800" height="800" preserveAspectRatio="xMidYMid meet"/>
  <!-- Small brand footer -->
  <text x="450" y="900" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#16a34a">TaxiTao — taxitao.co.ke</text>
  <text x="450" y="945" text-anchor="middle" font-family="system-ui, sans-serif" font-size="22" font-weight="400" fill="#6b7280">Scan to download on Google Play</text>
</svg>`;
}

/** Generates the SVG string for the full Branded Marketing Sticker */
function buildBrandedStickerSvg(qrBase64: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16a34a"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="badgeGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="1200" fill="url(#bgGrad)"/>

  <!-- Decorative circles -->
  <circle cx="1100" cy="150" r="220" fill="#ffffff" opacity="0.06"/>
  <circle cx="100"  cy="1050" r="200" fill="#ffffff" opacity="0.06"/>
  <circle cx="600"  cy="600"  r="550" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.08"/>

  <!-- Top brand bar -->
  <rect x="0" y="0" width="1200" height="140" fill="#000000" opacity="0.20"/>
  <text x="600" y="92" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-2">TaxiTao</text>

  <!-- Tagline badge -->
  <rect x="350" y="115" width="500" height="50" rx="25" fill="url(#badgeGrad)"/>
  <text x="600" y="148" text-anchor="middle" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#1f2937">YOUR TRUSTED RIDE PARTNER</text>

  <!-- QR Code card -->
  <rect x="175" y="195" width="850" height="700" rx="40" fill="#ffffff" filter="url(#cardShadow)"/>
  <image xlink:href="${qrBase64}" x="200" y="215" width="800" height="640" preserveAspectRatio="xMidYMid meet"/>

  <!-- Scan instruction row -->
  <rect x="0" y="920" width="1200" height="140" fill="#000000" opacity="0.25"/>
  <text x="600" y="980" text-anchor="middle" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#FCD34D">📱 SCAN TO DOWNLOAD THE APP</text>
  <text x="600" y="1035" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#d1fae5">Available on Google Play Store</text>

  <!-- Bottom URL strip -->
  <rect x="0" y="1060" width="1200" height="140" fill="#ffffff" opacity="0.10"/>
  <text x="600" y="1140" text-anchor="middle" font-family="system-ui, sans-serif" font-size="38" font-weight="700" fill="#ffffff">taxitao.co.ke</text>
</svg>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MarketingTab() {
  const [style, setStyle] = useState<StickerStyle>("branded_sticker");
  const [qrBase64, setQrBase64] = useState<string>("");
  const [svgString, setSvgString] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [exportingPng, setExportingPng] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadedSvg, setDownloadedSvg] = useState(false);
  const [downloadedPng, setDownloadedPng] = useState(false);

  // Generate QR code on mount and when destination URL changes
  const regenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qr = await generateQRBase64(APP_PLAY_STORE_URL);
      setQrBase64(qr);
    } catch (e) {
      setError("Failed to generate QR code. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Rebuild SVG whenever style or QR data changes
  useEffect(() => {
    if (!qrBase64) return;
    if (style === "raw_qr") {
      setSvgString(buildRawQrSvg(qrBase64));
    } else {
      setSvgString(buildBrandedStickerSvg(qrBase64));
    }
  }, [style, qrBase64]);

  // ── Export: SVG ──────────────────────────────────────────────────────────
  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `taxitao-${style}-qr.svg`);
    setDownloadedSvg(true);
    setTimeout(() => setDownloadedSvg(false), 2000);
  };

  // ── Export: PNG ──────────────────────────────────────────────────────────
  const handleDownloadPng = async () => {
    if (!svgString) return;
    setExportingPng(true);
    setError(null);
    try {
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.src = url;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        setTimeout(() => reject(new Error("Timeout loading SVG")), 10000);
      });

      const dim = style === "raw_qr" ? { w: 900, h: 960 } : { w: 1200, h: 1200 };
      const canvas = document.createElement("canvas");
      canvas.width = dim.w;
      canvas.height = dim.h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable.");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, dim.w, dim.h);
      ctx.drawImage(img, 0, 0, dim.w, dim.h);
      URL.revokeObjectURL(url);

      const pngBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png", 1)
      );
      if (!pngBlob) throw new Error("PNG conversion failed.");
      downloadBlob(pngBlob, `taxitao-${style}-qr.png`);
      setDownloadedPng(true);
      setTimeout(() => setDownloadedPng(false), 2000);
    } catch (e: any) {
      // Hypothesis 1 mitigation: Safari canvas tainting — catch SecurityError and guide user to SVG
      setError(
        e?.name === "SecurityError"
          ? "PNG export blocked by browser security (Safari). Please use the SVG download instead — it is equally high quality."
          : `PNG export failed: ${e?.message ?? "unknown error"}. Try downloading the SVG instead.`
      );
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <QrCode className="w-7 h-7 text-indigo-600" />
            Marketing Materials
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Generate high-quality QR codes and stickers for print and digital marketing campaigns.
          </p>
        </div>
        <button
          onClick={regenerate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Regenerate QR
        </button>
      </div>

      {/* Play Store URL display */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-1">QR Destination (Google Play Store)</p>
          <p className="text-sm text-indigo-700 font-mono break-all">{APP_PLAY_STORE_URL}</p>
          <p className="text-xs text-indigo-500 mt-1">
            Update <code className="bg-indigo-100 px-1 rounded">APP_PLAY_STORE_URL</code> in{" "}
            <code className="bg-indigo-100 px-1 rounded">MarketingTab.tsx</code> when the app goes live on the public Play Store.
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-600 underline mt-1">Dismiss</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Controls ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Style selector */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Sticker Style</h3>
            {(Object.keys(STICKER_STYLES) as StickerStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  style === s
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <p className={`font-bold text-sm ${style === s ? "text-indigo-700" : "text-gray-800"}`}>
                  {STICKER_STYLES[s].label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{STICKER_STYLES[s].description}</p>
              </button>
            ))}
          </div>

          {/* Export actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Export</h3>

            <button
              onClick={handleDownloadSvg}
              disabled={loading || !svgString}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm transition disabled:opacity-50"
            >
              {downloadedSvg ? <Check className="w-4 h-4 text-green-600" /> : <Download className="w-4 h-4" />}
              {downloadedSvg ? "Downloaded!" : "Download SVG (Vector)"}
            </button>

            <button
              onClick={handleDownloadPng}
              disabled={loading || exportingPng || !svgString}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-60 shadow-lg shadow-indigo-200"
            >
              {exportingPng ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : downloadedPng ? (
                <Check className="w-4 h-4" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {exportingPng ? "Exporting…" : downloadedPng ? "Downloaded!" : "Download PNG (Print-Ready)"}
            </button>
          </div>

          {/* Print guidance */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
            <p className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider">
              <Printer className="w-4 h-4" /> Print Guidance
            </p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Use <strong>PNG</strong> for digital sharing (WhatsApp, email, social media).</li>
              <li>Use <strong>SVG</strong> for professional print shops — it scales to any size without quality loss.</li>
              <li>For car stickers, request <strong>vinyl print</strong> at 10×10 cm minimum.</li>
              <li>The QR uses <strong>H-level error correction</strong>, meaning it still works even if up to 30% of the sticker is worn or dirty.</li>
            </ul>
          </div>
        </div>

        {/* ── Preview ───────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-24">
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Live Preview</p>
              <p className="text-xs text-gray-400">{STICKER_STYLES[style].label}</p>
            </div>
            <div className="w-full bg-gray-50 flex items-center justify-center p-6 min-h-[450px]">
              {loading ? (
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 font-medium">Generating QR code…</p>
                </div>
              ) : svgString ? (
                <div
                  className="w-full max-h-[70vh] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[65vh] [&>svg]:shadow-xl [&>svg]:rounded-xl"
                  // SVG is 100% internally generated — no user input is injected without escaping.
                  // The qrBase64 is a data URL from the qrcode library (no HTML), and all
                  // brand strings are hardcoded constants, not user-supplied values.
                  dangerouslySetInnerHTML={{ __html: svgString }}
                />
              ) : (
                <div className="text-center space-y-2">
                  <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                  <p className="text-sm text-gray-600">Preview unavailable</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
