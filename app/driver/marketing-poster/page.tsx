"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";

type PosterSize = "instagram_portrait" | "square" | "story";
type PosterTemplate = "transformation" | "bold" | "minimal";

const SIZES: Record<PosterSize, { w: number; h: number; label: string }> = {
  instagram_portrait: { w: 1080, h: 1350, label: "Instagram Portrait (1080×1350)" },
  square: { w: 1080, h: 1080, label: "Square (1080×1080)" },
  story: { w: 1080, h: 1920, label: "Instagram Story (1080×1920)" },
};

const TEMPLATES: Record<PosterTemplate, { name: string; description: string }> = {
  transformation: { name: "Transformation", description: "Bold & Creative" },
  bold: { name: "Bold Impact", description: "High Visibility" },
  minimal: { name: "Clean Modern", description: "Professional" },
};

// Default Avatar SVG as base64
const DEFAULT_AVATAR_BASE64 = `data:image/svg+xml;base64,${btoa(`
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#16a34a"/>
  <circle cx="200" cy="150" r="70" fill="#ffffff"/>
  <ellipse cx="200" cy="320" rx="120" ry="100" fill="#ffffff"/>
</svg>
`)}`;

function safeText(v: unknown, fallback = "") {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return t.length ? t : fallback;
}

function formatPhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });
}

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

// Convert image URL to base64 with CORS handling
async function urlToBase64(url: string): Promise<string> {
  try {
    // For Firebase Storage URLs, we can fetch directly
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    return "";
  }
}

// Generate QR Code as base64 using qrcode library
async function generateQRCodeBase64(text: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return qrDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    return "";
  }
}

export default function DriverMarketingPosterPage() {
  const { user, driverProfile, loading } = useAuth();
  const router = useRouter();
  const [size, setSize] = useState<PosterSize>("instagram_portrait");
  const [template, setTemplate] = useState<PosterTemplate>("transformation");
  const [qrDestination, setQrDestination] = useState<"profile" | "app">("profile");
  // TODO: Replace with actual App Store link provided by user
  const APP_DOWNLOAD_LINK = "https://play.google.com/store/apps/details?id=com.taxitao.app";

  const [exportingPng, setExportingPng] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingImages, setLoadingImages] = useState(true);
  const [embeddedImages, setEmbeddedImages] = useState<{
    profilePhoto: string;
    vehiclePhoto: string;
    qrCode: string;
  }>({
    profilePhoto: "",
    vehiclePhoto: "",
    qrCode: "",
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !driverProfile) router.push("/");
  }, [user, driverProfile, loading, router]);

  const posterData = useMemo(() => {
    if (!driverProfile) return null;
    const vehicle = driverProfile.vehicles?.[0];
    const name = safeText(driverProfile.name, "TaxiTao Driver");
    const baseLocation = safeText(driverProfile.businessLocation, "Nairobi");
    const rating = driverProfile.rating || 5.0;
    const phone = safeText(driverProfile.phone, "");
    const whatsapp = safeText(driverProfile.whatsapp, "") || (phone ? formatPhoneForWhatsApp(phone) : "");
    const bio = safeText(driverProfile.bio, "Safe, reliable rides — book anytime.");
    const photoUrl = safeText(driverProfile.profilePhotoUrl, "");
    const vehicleImageUrl = safeText(vehicle?.images?.[0], "");
    const vehicleLine = vehicle
      ? `${safeText(vehicle.make)} ${safeText(vehicle.model)}${vehicle.year ? ` • ${vehicle.year}` : ""}`
      : "Vehicle available";
    const plate = vehicle ? safeText(vehicle.plate, "") : "";
    
    // Determine QR Code URL based on selection
    let publicProfileText = "https://taxitao.co.ke";
    if (driverProfile.id) {
      if (qrDestination === "app") {
        // Append referrer/driver ID to app store link for attribution
        publicProfileText = `${APP_DOWNLOAD_LINK}&referrer=driver_id%3D${driverProfile.id}`;
      } else {
        // Link to web profile/booking page
        publicProfileText = `https://taxitao.co.ke/d/${driverProfile.id}`;
      }
    }

    const captionLines = [
      `Need a ride? Book with ${name}.`,
      baseLocation ? `📍 ${baseLocation}` : null,
      vehicle ? `🚗 ${vehicleLine}${plate ? ` • ${plate}` : ""}` : null,
      rating ? `⭐ Rating: ${rating.toFixed(1)}` : null,
      phone ? `📞 Call: ${phone}` : null,
      whatsapp ? `💬 WhatsApp: wa.me/${whatsapp}` : null,
      `🔗 Book: ${publicProfileText}`,
      `#TaxiTao #Taxi #Ride #Transport`,
    ].filter(Boolean) as string[];

    return {
      name, rating, baseLocation, phone, whatsapp, bio,
      photoUrl, vehicleImageUrl, vehicleLine, plate,
      publicProfileText, caption: captionLines.join("\n"),
    };
  }, [driverProfile, qrDestination]);

  // Load and embed ALL images when poster data changes
  useEffect(() => {
    async function loadImages() {
      if (!posterData) return;
      
      setLoadingImages(true);
      setExportError(null);
      
      try {
        // Load profile photo (or use default avatar)
        let profileBase64 = DEFAULT_AVATAR_BASE64;
        if (posterData.photoUrl) {
          const loadedProfile = await urlToBase64(posterData.photoUrl);
          if (loadedProfile) {
            profileBase64 = loadedProfile;
          }
        }

        // Load vehicle photo (optional)
        let vehicleBase64 = "";
        if (posterData.vehicleImageUrl) {
          vehicleBase64 = await urlToBase64(posterData.vehicleImageUrl);
        }

        // Generate QR code
        const qrBase64 = await generateQRCodeBase64(posterData.publicProfileText);

        setEmbeddedImages({
          profilePhoto: profileBase64,
          vehiclePhoto: vehicleBase64,
          qrCode: qrBase64,
        });

        console.log("✅ All images embedded successfully!");
      } catch (error) {
        console.error("❌ Error loading images:", error);
        setExportError("Some images failed to load. Using fallbacks.");
        
        // Set fallbacks
        setEmbeddedImages({
          profilePhoto: DEFAULT_AVATAR_BASE64,
          vehiclePhoto: "",
          qrCode: await generateQRCodeBase64(posterData.publicProfileText),
        });
      } finally {
        setLoadingImages(false);
      }
    }

    loadImages();
  }, [posterData]);

  const { w, h } = SIZES[size];

  const generateTransformationSVG = () => {
    if (!posterData) return "";
    const safeName = escapeXml(posterData.name);
    const safeLoc = escapeXml(posterData.baseLocation);
    const safeVehicle = escapeXml(posterData.vehicleLine);
    const safePlate = escapeXml(posterData.plate);
    const safePhone = escapeXml(posterData.phone || "");
    const safeWa = escapeXml(posterData.whatsapp || "");

    // Use embedded base64 images
    const profileImg = embeddedImages.profilePhoto;
    const vehicleImg = embeddedImages.vehiclePhoto;
    const qrImg = embeddedImages.qrCode;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#000000" flood-opacity="0.2"/>
    </filter>
    <clipPath id="photoClip">
      <circle cx="240" cy="660" r="80"/>
    </clipPath>
    <clipPath id="vehicleClip">
      <rect x="180" y="915" width="160" height="120" rx="15"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bgGrad)"/>
  
  <!-- Decorative circles -->
  <circle cx="900" cy="300" r="200" fill="#ffffff" opacity="0.1"/>
  <circle cx="200" cy="1100" r="250" fill="#ffffff" opacity="0.1"/>
  
  <!-- Top Branding -->
  <rect x="0" y="0" width="${w}" height="160" fill="#16a34a"/>
  <text x="60" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="#ffffff">TaxiTao</text>
  <text x="${w - 60}" y="100" text-anchor="end" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#dcfce7">#RideWithTrust</text>

  <!-- Main Content Area -->
  <text x="540" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="56" font-weight="900" fill="#1f2937">Need a Reliable Ride?</text>
  <text x="540" y="400" text-anchor="middle" font-family="system-ui, sans-serif" font-size="88" font-weight="900" fill="#16a34a">BOOK NOW</text>

  <!-- === UPPER CONTAINER: DRIVER DETAILS === -->
  <rect x="140" y="500" width="800" height="320" rx="30" fill="#ffffff" filter="url(#shadow)"/>
  
  <!-- Profile Photo -->
  <circle cx="240" cy="660" r="85" fill="#16a34a"/>
  <image xlink:href="${profileImg}" x="160" y="580" width="160" height="160" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Driver Info Text -->
  <text x="360" y="610" font-family="system-ui, sans-serif" font-size="48" font-weight="900" fill="#1f2937">${safeName}</text>
  <text x="360" y="660" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#16a34a">★★★★★ ${posterData.rating.toFixed(1)}</text>
  <text x="360" y="710" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#6b7280">📍 ${safeLoc}</text>
  <text x="360" y="760" font-family="system-ui, sans-serif" font-size="26" font-weight="700" fill="#1f2937">📞 ${safePhone}</text>

  <!-- === LOWER CONTAINER: VEHICLE & QR === -->
  <rect x="140" y="850" width="800" height="250" rx="30" fill="#ffffff" filter="url(#shadow)"/>
  
  <!-- Vehicle Image -->
  ${vehicleImg ? `
    <rect x="180" y="915" width="160" height="120" rx="15" fill="#f3f4f6"/>
    <image xlink:href="${vehicleImg}" x="180" y="915" width="160" height="120" clip-path="url(#vehicleClip)" preserveAspectRatio="xMidYMid slice"/>
  ` : `
    <rect x="180" y="915" width="160" height="120" rx="15" fill="#f3f4f6"/>
    <text x="260" y="985" text-anchor="middle" font-size="40">🚗</text>
  `}

  <!-- Vehicle Details -->
  <text x="370" y="960" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#1f2937">🚗 ${safeVehicle}</text>
  <text x="370" y="1000" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#6b7280">${safePlate}</text>

  <!-- QR Code (Right Side) -->
  <rect x="730" y="895" width="160" height="160" rx="15" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
  <image xlink:href="${qrImg}" x="740" y="905" width="140" height="140" preserveAspectRatio="xMidYMid meet"/>
  <text x="810" y="1080" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#16a34a">SCAN ME</text>

  <!-- Bottom Bar -->
  <rect x="0" y="${h - 180}" width="${w}" height="180" fill="#1f2937"/>
  <text x="540" y="${h - 110}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="900" fill="#ffffff">💬 WhatsApp: wa.me/${safeWa}</text>
  <text x="540" y="${h - 60}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#10b981">Scan QR or Visit: taxitao.co.ke</text>
</svg>`;
  };

  const generateBoldSVG = () => {
    if (!posterData) return "";
    const safeName = escapeXml(posterData.name);
    const qrImg = embeddedImages.qrCode;
    const vehicleImg = embeddedImages.vehiclePhoto;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="boldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <clipPath id="boldVehicleClip">
      <rect x="440" y="740" width="200" height="60" rx="8"/>
    </clipPath>
  </defs>

  <rect fill="url(#boldGrad)" width="${w}" height="${h}"/>
  
  <!-- Geometric patterns -->
  <circle cx="900" cy="200" r="250" fill="#ffffff" opacity="0.05"/>
  <circle cx="200" cy="1100" r="300" fill="#ffffff" opacity="0.05"/>
  
  <!-- TaxiTao Branding -->
  <text x="540" y="220" text-anchor="middle" font-family="system-ui, sans-serif" font-size="96" font-weight="900" fill="#ffffff">TaxiTao</text>
  <text x="540" y="290" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="700" fill="#d1fae5">YOUR TRUSTED RIDE PARTNER</text>

  <!-- Main Message -->
  <rect x="100" y="400" width="880" height="700" rx="40" fill="#ffffff" opacity="0.98"/>
  
  <text x="540" y="520" text-anchor="middle" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#1f2937">BOOK YOUR RIDE</text>
  <text x="540" y="600" text-anchor="middle" font-family="system-ui, sans-serif" font-size="72" font-weight="900" fill="#059669">${safeName}</text>
  
  <text x="540" y="700" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="700" fill="#4b5563">⭐ ${posterData.rating.toFixed(1)} Rating • 📍 ${escapeXml(posterData.baseLocation)}</text>
  
  ${vehicleImg ? `
    <image xlink:href="${vehicleImg}" x="390" y="730" width="100" height="75" rx="8" preserveAspectRatio="xMidYMid slice"/>
    <text x="500" y="760" text-anchor="start" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#6b7280">🚗 ${escapeXml(posterData.vehicleLine)}</text>
    <text x="500" y="800" text-anchor="start" font-family="system-ui, sans-serif" font-size="28" font-weight="600" fill="#9ca3af">${escapeXml(posterData.plate)}</text>
  ` : `
    <text x="540" y="780" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#6b7280">🚗 ${escapeXml(posterData.vehicleLine)} • ${escapeXml(posterData.plate)}</text>
  `}

  <rect x="340" y="840" width="400" height="180" rx="20" fill="#f0fdf4" stroke="#16a34a" stroke-width="4"/>
  <image xlink:href="${qrImg}" x="380" y="870" width="120" height="120" preserveAspectRatio="xMidYMid meet"/>
  <text x="530" y="920" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#1f2937">SCAN TO</text>
  <text x="530" y="960" font-family="system-ui, sans-serif" font-size="26" font-weight="800" fill="#059669">BOOK NOW</text>

  <text x="540" y="1050" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#1f2937">📞 ${escapeXml(posterData.phone)}</text>

  <rect x="0" y="${h - 150}" width="${w}" height="150" fill="#1f2937"/>
  <text x="540" y="${h - 75}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="700" fill="#10b981">💬 wa.me/${escapeXml(posterData.whatsapp)}</text>
</svg>`;
  };

  const generateMinimalSVG = () => {
    if (!posterData) return "";
    const profileImg = embeddedImages.profilePhoto;
    const qrImg = embeddedImages.qrCode;
    const vehicleImg = embeddedImages.vehiclePhoto;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <clipPath id="minPhoto"><rect x="390" y="340" width="300" height="300" rx="20"/></clipPath>
    <clipPath id="minVehicle"><rect x="490" y="880" width="100" height="75" rx="8"/></clipPath>
  </defs>
  
  <rect fill="#f8fafc" width="${w}" height="${h}"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="${w}" height="200" fill="#16a34a"/>
  <text x="540" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="84" font-weight="900" fill="#ffffff">TaxiTao</text>

  <!-- Content Card -->
  <rect x="120" y="280" width="840" height="900" rx="30" fill="#ffffff" stroke="#e2e8f0" stroke-width="3"/>
  
  <!-- Driver Photo (EMBEDDED) -->
  <image xlink:href="${profileImg}" x="390" y="340" width="300" height="300" clip-path="url(#minPhoto)" preserveAspectRatio="xMidYMid slice"/>
  
  <text x="540" y="720" text-anchor="middle" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#1f2937">${escapeXml(posterData.name)}</text>
  <text x="540" y="780" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="#16a34a">★ ${posterData.rating.toFixed(1)} • ${escapeXml(posterData.baseLocation)}</text>
  
  <line x1="220" y1="840" x2="860" y2="840" stroke="#e5e7eb" stroke-width="2"/>
  
  ${vehicleImg ? `
    <image xlink:href="${vehicleImg}" x="220" y="880" width="120" height="90" rx="8" preserveAspectRatio="xMidYMid slice"/>
    <text x="360" y="920" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#4b5563">🚗 ${escapeXml(posterData.vehicleLine)}</text>
    <text x="360" y="960" font-family="system-ui, sans-serif" font-size="24" font-weight="600" fill="#9ca3af">${escapeXml(posterData.plate)}</text>
  ` : `
    <text x="540" y="920" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#4b5563">🚗 ${escapeXml(posterData.vehicleLine)}</text>
  `}
  
  <text x="540" y="1020" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#16a34a">📞 ${escapeXml(posterData.phone)}</text>

  <rect x="440" y="1060" width="200" height="200" rx="15" fill="#ffffff" stroke="#16a34a" stroke-width="3"/>
  <image xlink:href="${qrImg}" x="450" y="1070" width="180" height="180" preserveAspectRatio="xMidYMid meet"/>
  
  <rect x="0" y="${h - 100}" width="${w}" height="100" fill="#1f2937"/>
  <text x="540" y="${h - 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#10b981">taxitao.co.ke</text>
</svg>`;
  };

  const posterSvgString = useMemo(() => {
    if (loadingImages || !embeddedImages.qrCode) return "";
    if (template === "transformation") return generateTransformationSVG();
    if (template === "bold") return generateBoldSVG();
    return generateMinimalSVG();
  }, [posterData, template, w, h, embeddedImages, loadingImages]);

  const handleCopyCaption = async () => {
    if (!posterData) return;
    try {
      await navigator.clipboard.writeText(posterData.caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setExportError("Could not copy to clipboard.");
    }
  };

  const handleDownloadSvg = () => {
    if (!posterSvgString) return;
    setExportError(null);
    const blob = new Blob([posterSvgString], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, `taxitao-poster-${template}-${size}.svg`);
  };

  const handleDownloadPng = async () => {
    if (!posterSvgString) return;
    setExportError(null);
    setExportingPng(true);
    try {
      const svgBlob = new Blob([posterSvgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.src = url;
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image load failed"));
        setTimeout(() => reject(new Error("Timeout")), 10000);
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      
      const pngBlob: Blob | null = await new Promise((resolve) => 
        canvas.toBlob(resolve, "image/png", 1)
      );
      
      if (!pngBlob) throw new Error("PNG export failed");
      downloadBlob(pngBlob, `taxitao-poster-${template}-${size}.png`);
      
      console.log("✅ PNG downloaded successfully with all embedded images!");
    } catch (e: any) {
      console.error("❌ PNG export error:", e);
      setExportError(`Export failed: ${e.message}. Try SVG instead.`);
    } finally {
      setExportingPng(false);
    }
  };

  if (loading || !driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/driver/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Marketing Poster Generator
              </h1>
              <p className="text-sm text-gray-500">
                Create stunning posters for WhatsApp, Instagram & Facebook
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyCaption}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy caption"}
            </button>
            <button
              onClick={handleDownloadSvg}
              disabled={loadingImages}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              <Download className="w-4 h-4" /> SVG
            </button>
            <button
              onClick={handleDownloadPng}
              disabled={exportingPng || loadingImages}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
            >
              {exportingPng || loadingImages ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              {loadingImages ? "Loading..." : exportingPng ? "Exporting…" : "Download PNG"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Loading Status */}
          {loadingImages && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div>
                <p className="font-semibold text-blue-900 text-sm">Preparing assets...</p>
                <p className="text-xs text-blue-700">Embedding images for offline use</p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {exportError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">{exportError}</p>
                <button 
                  onClick={() => setExportError(null)}
                  className="text-xs text-red-700 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {!loadingImages && embeddedImages.qrCode && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600" />
              <p className="font-semibold text-green-900 text-sm">✅ All images embedded! Ready to download.</p>
            </div>
          )}

          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Choose Template
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(TEMPLATES) as PosterTemplate[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left ${
                    template === t
                      ? "bg-green-50 border-green-600 text-green-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold">{TEMPLATES[t].name}</div>
                  <div className="text-xs opacity-75">{TEMPLATES[t].description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3">Poster Size</h2>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(SIZES) as PosterSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    size === s
                      ? "bg-green-50 border-green-600 text-green-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {SIZES[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* QR Destination Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3">QR Code Destination</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQrDestination("profile")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  qrDestination === "profile"
                    ? "bg-green-50 border-green-600 text-green-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Booking Page
              </button>
              <button
                onClick={() => setQrDestination("app")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  qrDestination === "app"
                    ? "bg-green-50 border-green-600 text-green-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                App Download
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {qrDestination === "profile" 
                ? "Scanners will go to your web booking profile." 
                : "Scanners will be directed to download the app with your referral."}
            </p>
          </div>

          {/* Usage Guide */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-5">
            <h3 className="font-bold text-gray-900 mb-3">📱 How to Use</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li><strong>1.</strong> Choose your favorite template</li>
              <li><strong>2.</strong> Select size for your platform</li>
              <li><strong>3.</strong> Wait for images to embed (takes a few seconds)</li>
              <li><strong>4.</strong> Click "Download PNG"</li>
              <li><strong>5.</strong> Share on WhatsApp Status, Instagram & Facebook</li>
              <li><strong>6.</strong> Copy caption and paste when posting</li>
            </ol>
          </div>

          {/* Technical Info */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">✓ Features</h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• All images embedded (no broken links)</li>
              <li>• Works offline after download</li>
              <li>• QR code generated client-side</li>
              <li>• High-quality PNG export</li>
              <li>• Professional default avatar included</li>
            </ul>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden sticky top-24">
            <div className="aspect-[4/5] w-full bg-gray-100 flex items-center justify-center p-4 md:p-8">
              {loadingImages ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Loading your poster...</p>
                  <p className="text-sm text-gray-500 mt-2">Embedding images for offline use</p>
                </div>
              ) : posterSvgString ? (
                <div className="w-full h-full shadow-2xl bg-white relative overflow-hidden rounded-lg">
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: posterSvgString }}
                  />
                </div>
              ) : (
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Failed to generate poster</p>
                  <p className="text-sm text-gray-500 mt-2">Please try refreshing the page</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
