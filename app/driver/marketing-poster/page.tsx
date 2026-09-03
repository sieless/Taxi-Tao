"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
// DOMPurify removed: our SVG is fully server-generated with escapeXml() on all user input.
// DOMPurify incorrectly strips valid SVG elements (<image xlink:href>, <clipPath>, <filter>,
// <linearGradient>) causing broken images, QR codes, and missing styles in the poster renderer.
import { getDriverPricing } from "@/lib/pricing-service";

import { logError } from "@/lib/logger";
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
type PosterTemplate = "transformation" | "bold" | "minimal" | "sticker";

const SIZES: Record<PosterSize, { w: number; h: number; label: string }> = {
  instagram_portrait: { w: 1080, h: 1350, label: "Instagram Portrait (1080×1350)" },
  square: { w: 1080, h: 1080, label: "Square (1080×1080)" },
  story: { w: 1080, h: 1920, label: "Instagram Story (1080×1920)" },
};

// Sticker is always 1200×1200 — fixed dimension regardless of size selector
const STICKER_DIMENSION = { w: 1200, h: 1200 };

const TEMPLATES: Record<PosterTemplate, { name: string; description: string }> = {
  transformation: { name: "Transformation", description: "Bold & Creative" },
  bold: { name: "Bold Impact", description: "High Visibility" },
  minimal: { name: "Clean Modern", description: "Professional" },
  sticker: { name: "🚗 Car Window Sticker", description: "Print-Ready • 1200×1200" },
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

// Convert image URL to base64 with multi-tier CORS & HTML Image element fallbacks
async function urlToBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;

  // Tier 1: Try fetch with CORS mode
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit" });
    if (response.ok) {
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsDataURL(blob);
      });
      if (base64) return base64;
    }
  } catch (error) {
    // Proceed to Tier 2
  }

  // Tier 2: Try HTML Image Element + Canvas
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      setTimeout(reject, 3500);
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 400;
    canvas.height = img.naturalHeight || 400;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl && dataUrl.length > 100) return dataUrl;
    }
  } catch (error) {
    // Proceed to Tier 3
  }

  // Tier 3: Direct URL fallback (SVG <image xlink:href="..."> can attempt direct render)
  return url;
}

// Generate QR Code as base64 with TaxiTao logo embedded in the center
async function generateQRCodeBase64(text: string, logoUrl = "/icon.png"): Promise<string> {
  try {
    const QRCode = await import("qrcode");
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;

    await QRCode.toCanvas(canvas, text, {
      width: 600,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
      errorCorrectionLevel: "H", // High error correction (30%) allows clean center logo badge
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
          setTimeout(resolve, 2000);
        });

        if (logoImg.complete && logoImg.naturalWidth > 0) {
          const logoSize = 120; // 20% of canvas width
          const x = (600 - logoSize) / 2;
          const y = (600 - logoSize) / 2;

          // Clean rounded white badge behind logo
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(x - 8, y - 8, logoSize + 16, logoSize + 16, 16);
          } else {
            ctx.rect(x - 8, y - 8, logoSize + 16, logoSize + 16);
          }
          ctx.fill();

          ctx.strokeStyle = "#16a34a";
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        }
      } catch (err) {
        logError("page", err);
      }
    }

    return canvas.toDataURL("image/png");
  } catch (error) {
    logError("page", error);
    return "";
  }
}

// Play Store direct app URL
const APP_DOWNLOAD_LINK = "https://play.google.com/store/apps/details?id=com.taxitao.mobile";

export default function DriverMarketingPosterPage() {
  const { user, driverProfile, loading } = useAuth();
  const router = useRouter();
  const [size, setSize] = useState<PosterSize>("instagram_portrait");
  const [template, setTemplate] = useState<PosterTemplate>("transformation");
  const [qrDestination, setQrDestination] = useState<"profile" | "app">("profile");

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
  const [routePrices, setRoutePrices] = useState<Array<{ route: string; price: number }>>([]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!loading && user && !driverProfile) router.push("/");
  }, [user, driverProfile, loading, router]);

  // Fetch route pricing data
  useEffect(() => {
    async function fetchPricing() {
      if (!driverProfile?.id) return;
      try {
        const pricing = await getDriverPricing(driverProfile.id);
        if (pricing?.routePricing) {
          // Convert routePricing object to array and take top 4
          const routes = Object.entries(pricing.routePricing)
            .map(([key, data]: [string, any]) => ({
              route: key.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' → '),
              price: data.price || 0
            }))
            .filter(r => r.price > 0)
            .slice(0, 4);
          setRoutePrices(routes);
        }
      } catch (error) {
        logError("page", error);
      }
    }
    fetchPricing();
  }, [driverProfile?.id]);

  const posterData = useMemo(() => {
    if (!driverProfile) return null;
    const vehicle = driverProfile.vehicles?.[0];
    const name = safeText(driverProfile.name, "TaxiTao Driver");
    const baseLocation = safeText(driverProfile.businessLocation, "Nairobi");
    const rating = driverProfile.rating || 5.0;
    const phone = safeText(driverProfile.phone, "");
    const whatsapp = safeText(driverProfile.whatsapp, "") || (phone ? formatPhoneForWhatsApp(phone) : "");
    const bio = safeText(driverProfile.bio, "Safe, reliable rides — book anytime.");
    const photoUrl = safeText(
      driverProfile.profilePhotoUrl || (driverProfile as any).photoUrl || user?.photoURL,
      ""
    );
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
      } catch (error) {
        logError("page", error);
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

    // Dynamic layout calculations based on poster height
    const isSquare = h === 1080;
    const isStory = h === 1920;
    
    // Header & bottom bar heights
    const headerHeight = isSquare ? 120 : isStory ? 180 : 150;
    const bottomBarHeight = isSquare ? 120 : isStory ? 180 : 150;
    const bottomBarY = h - bottomBarHeight;
    
    // Section heights & Y positions
    const ctaY = headerHeight + (isSquare ? 15 : isStory ? 60 : 35);
    const ctaHeight = isSquare ? 130 : isStory ? 240 : 180;
    
    const driverCardY = ctaY + ctaHeight + (isSquare ? 15 : isStory ? 40 : 25);
    const driverCardHeight = isSquare ? 210 : isStory ? 320 : 260;

    const vehicleCardY = driverCardY + driverCardHeight + (isSquare ? 15 : isStory ? 35 : 25);
    const vehicleCardHeight = isSquare ? 180 : isStory ? 260 : 210;

    const maxRoutes = isSquare ? 2 : isStory ? 4 : 3;
    const displayRoutes = routePrices.slice(0, maxRoutes);
    const routeRowHeight = isSquare ? 35 : isStory ? 55 : 45;
    const routeCardY = vehicleCardY + vehicleCardHeight + (isSquare ? 15 : isStory ? 35 : 25);
    const routeCardHeight = displayRoutes.length > 0 ? (displayRoutes.length * routeRowHeight + (isSquare ? 50 : 65)) : 0;
    
    // Font sizes
    const titleSize = isSquare ? 40 : isStory ? 64 : 52;
    const ctaSize = isSquare ? 60 : isStory ? 96 : 80;
    const nameSize = isSquare ? 34 : isStory ? 52 : 44;
    const ratingSize = isSquare ? 20 : isStory ? 30 : 24;
    const locationSize = isSquare ? 18 : isStory ? 26 : 22;
    const phoneSize = isSquare ? 20 : isStory ? 28 : 24;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
    <clipPath id="photoClip">
      <circle cx="230" cy="${driverCardY + (driverCardHeight / 2)}" r="${isSquare ? 60 : 75}"/>
    </clipPath>
    <clipPath id="vehicleClip">
      <rect x="170" y="${vehicleCardY + (isSquare ? 35 : 45)}" width="${isSquare ? 130 : 150}" height="${isSquare ? 100 : 120}" rx="12"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#bgGrad)"/>
  
  <!-- Decorative circles -->
  <circle cx="900" cy="300" r="200" fill="#ffffff" opacity="0.1"/>
  <circle cx="200" cy="${h - 250}" r="250" fill="#ffffff" opacity="0.1"/>
  
  <!-- Top Branding -->
  <rect x="0" y="0" width="${w}" height="${headerHeight}" fill="#16a34a"/>
  <text x="60" y="${headerHeight * 0.65}" font-family="system-ui, -apple-system, sans-serif" font-size="${isSquare ? 52 : 68}" font-weight="900" fill="#ffffff">TaxiTao</text>
  <text x="${w - 60}" y="${headerHeight * 0.65}" text-anchor="end" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 30}" font-weight="600" fill="#dcfce7">#RideWithTrust</text>

  <!-- Main Content Area -->
  <text x="540" y="${ctaY + (isSquare ? 45 : 60)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${titleSize}" font-weight="900" fill="#1f2937">Need a Reliable Ride?</text>
  <text x="540" y="${ctaY + (isSquare ? 105 : 140)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${ctaSize}" font-weight="900" fill="#16a34a">BOOK NOW</text>

  <!-- === UPPER CONTAINER: DRIVER DETAILS === -->
  <rect x="140" y="${driverCardY}" width="800" height="${driverCardHeight}" rx="24" fill="#ffffff" filter="url(#shadow)"/>
  
  <!-- Profile Photo -->
  <circle cx="230" cy="${driverCardY + (driverCardHeight / 2)}" r="${isSquare ? 64 : 79}" fill="#16a34a"/>
  <image xlink:href="${profileImg}" x="${230 - (isSquare ? 60 : 75)}" y="${driverCardY + (driverCardHeight / 2) - (isSquare ? 60 : 75)}" width="${isSquare ? 120 : 150}" height="${isSquare ? 120 : 150}" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>
  
  <!-- Driver Info Text -->
  <text x="${isSquare ? 320 : 340}" y="${driverCardY + (isSquare ? 55 : 70)}" font-family="system-ui, sans-serif" font-size="${nameSize}" font-weight="900" fill="#1f2937">${safeName}</text>
  <text x="${isSquare ? 320 : 340}" y="${driverCardY + (isSquare ? 95 : 120)}" font-family="system-ui, sans-serif" font-size="${ratingSize}" font-weight="700" fill="#16a34a">★★★★★ ${posterData.rating.toFixed(1)}</text>
  <text x="${isSquare ? 320 : 340}" y="${driverCardY + (isSquare ? 135 : 165)}" font-family="system-ui, sans-serif" font-size="${locationSize}" font-weight="600" fill="#6b7280">📍 ${safeLoc}</text>
  <text x="${isSquare ? 320 : 340}" y="${driverCardY + (isSquare ? 175 : 210)}" font-family="system-ui, sans-serif" font-size="${phoneSize}" font-weight="700" fill="#1f2937">📞 ${safePhone}</text>

  <!-- === LOWER CONTAINER: VEHICLE & QR === -->
  <rect x="140" y="${vehicleCardY}" width="800" height="${vehicleCardHeight}" rx="24" fill="#ffffff" filter="url(#shadow)"/>
  
  <!-- Vehicle Image -->
  ${vehicleImg ? `
    <rect x="170" y="${vehicleCardY + (isSquare ? 35 : 45)}" width="${isSquare ? 130 : 150}" height="${isSquare ? 100 : 120}" rx="12" fill="#f3f4f6"/>
    <image xlink:href="${vehicleImg}" x="170" y="${vehicleCardY + (isSquare ? 35 : 45)}" width="${isSquare ? 130 : 150}" height="${isSquare ? 100 : 120}" clip-path="url(#vehicleClip)" preserveAspectRatio="xMidYMid slice"/>
  ` : `
    <rect x="170" y="${vehicleCardY + (isSquare ? 35 : 45)}" width="${isSquare ? 130 : 150}" height="${isSquare ? 100 : 120}" rx="12" fill="#f3f4f6"/>
    <text x="${170 + (isSquare ? 65 : 75)}" y="${vehicleCardY + (isSquare ? 95 : 115)}" text-anchor="middle" font-size="${isSquare ? 36 : 44}">🚗</text>
  `}

  <!-- Vehicle Details -->
  <text x="${isSquare ? 320 : 340}" y="${vehicleCardY + (isSquare ? 80 : 100)}" font-family="system-ui, sans-serif" font-size="${ratingSize}" font-weight="700" fill="#1f2937">🚗 ${safeVehicle}</text>
  <text x="${isSquare ? 320 : 340}" y="${vehicleCardY + (isSquare ? 120 : 145)}" font-family="system-ui, sans-serif" font-size="${locationSize}" font-weight="600" fill="#6b7280">${safePlate}</text>

  <!-- QR Code (Right Side) -->
  <rect x="${isSquare ? 740 : 730}" y="${vehicleCardY + (isSquare ? 25 : 35)}" width="${isSquare ? 130 : 150}" height="${isSquare ? 130 : 150}" rx="12" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
  <image xlink:href="${qrImg}" x="${isSquare ? 745 : 735}" y="${vehicleCardY + (isSquare ? 30 : 40)}" width="${isSquare ? 120 : 140}" height="${isSquare ? 120 : 140}" preserveAspectRatio="xMidYMid meet"/>

  ${displayRoutes.length > 0 ? `
  <!-- === ROUTE PRICES SECTION === -->
  <rect x="140" y="${routeCardY}" width="800" height="${routeCardHeight}" rx="24" fill="#ffffff" filter="url(#shadow)"/>
  
  <text x="540" y="${routeCardY + (isSquare ? 38 : 45)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 22 : 28}" font-weight="900" fill="#16a34a">💰 Popular Routes</text>
  
  ${displayRoutes.map((rp, idx) => `
    <g>
      <rect x="170" y="${routeCardY + (isSquare ? 50 : 60) + idx * routeRowHeight}" width="740" height="${routeRowHeight - 4}" rx="6" fill="${idx % 2 === 0 ? '#f9fafb' : '#ffffff'}"/>
      <text x="190" y="${routeCardY + (isSquare ? 72 : 88) + idx * routeRowHeight}" font-family="system-ui, sans-serif" font-size="${isSquare ? 16 : 19}" font-weight="600" fill="#374151">${escapeXml(rp.route)}</text>
      <text x="890" y="${routeCardY + (isSquare ? 72 : 88) + idx * routeRowHeight}" text-anchor="end" font-family="system-ui, sans-serif" font-size="${isSquare ? 18 : 22}" font-weight="900" fill="#16a34a">KES ${rp.price.toLocaleString()}</text>
    </g>
  `).join('')}
  ` : ''}

  <!-- Bottom Bar -->
  <rect x="0" y="${bottomBarY}" width="${w}" height="${bottomBarHeight}" fill="#1f2937"/>
  <text x="540" y="${bottomBarY + (isSquare ? 50 : 65)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 28 : 34}" font-weight="900" fill="#ffffff">💬 WhatsApp: wa.me/${safeWa}</text>
  <text x="540" y="${bottomBarY + (isSquare ? 90 : 115)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 22 : 26}" font-weight="600" fill="#10b981">Scan QR or Visit: taxitao.co.ke</text>
</svg>`;
  };

  const generateBoldSVG = () => {
    if (!posterData) return "";
    const safeName = escapeXml(posterData.name);
    const qrImg = embeddedImages.qrCode;
    const vehicleImg = embeddedImages.vehiclePhoto;

    // Dynamic layout calculations
    const isSquare = h === 1080;
    const isStory = h === 1920;

    const headerHeight = isSquare ? 200 : isStory ? 320 : 260;
    const bottomBarHeight = isSquare ? 120 : isStory ? 180 : 150;
    const bottomBarY = h - bottomBarHeight;

    const contentCardY = isSquare ? 220 : isStory ? 350 : 280;
    const contentCardHeight = isSquare ? 540 : isStory ? 1000 : 700;

    const maxRoutes = isSquare ? 2 : isStory ? 4 : 3;
    const displayRoutes = routePrices.slice(0, maxRoutes);
    const routeRowHeight = 40;
    const routeCardY = contentCardY + contentCardHeight + (isSquare ? 15 : 30);
    const routeCardHeight = displayRoutes.length > 0 ? (displayRoutes.length * routeRowHeight + 60) : 0;
    
    // Font sizes
    const nameSize = isSquare ? 52 : isStory ? 76 : 64;
    const titleSize = isSquare ? 38 : isStory ? 54 : 46;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="boldGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>

  <rect fill="url(#boldGrad)" width="${w}" height="${h}"/>
  
  <!-- Geometric patterns -->
  <circle cx="900" cy="200" r="250" fill="#ffffff" opacity="0.05"/>
  <circle cx="200" cy="${h - 300}" r="300" fill="#ffffff" opacity="0.05"/>
  
  <!-- TaxiTao Branding -->
  <text x="540" y="${isSquare ? 130 : 180}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 72 : 92}" font-weight="900" fill="#ffffff">TaxiTao</text>
  <text x="540" y="${isSquare ? 180 : 240}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 30}" font-weight="700" fill="#d1fae5">YOUR TRUSTED RIDE PARTNER</text>

  <!-- Main Message -->
  <rect x="100" y="${contentCardY}" width="880" height="${contentCardHeight}" rx="32" fill="#ffffff" opacity="0.98"/>
  
  <text x="540" y="${contentCardY + (isSquare ? 80 : 110)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${titleSize}" font-weight="900" fill="#1f2937">BOOK YOUR RIDE</text>
  <text x="540" y="${contentCardY + (isSquare ? 145 : 190)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${nameSize}" font-weight="900" fill="#059669">${safeName}</text>
  
  <text x="540" y="${contentCardY + (isSquare ? 205 : 270)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 26 : 34}" font-weight="700" fill="#4b5563">⭐ ${posterData.rating.toFixed(1)} Rating • 📍 ${escapeXml(posterData.baseLocation)}</text>
  
  ${vehicleImg ? `
    <image xlink:href="${vehicleImg}" x="390" y="${contentCardY + (isSquare ? 230 : 310)}" width="100" height="75" rx="8" preserveAspectRatio="xMidYMid slice"/>
    <text x="500" y="${contentCardY + (isSquare ? 265 : 345)}" text-anchor="start" font-family="system-ui, sans-serif" font-size="${isSquare ? 26 : 30}" font-weight="600" fill="#6b7280">🚗 ${escapeXml(posterData.vehicleLine)}</text>
    <text x="500" y="${contentCardY + (isSquare ? 295 : 385)}" text-anchor="start" font-family="system-ui, sans-serif" font-size="${isSquare ? 22 : 26}" font-weight="600" fill="#9ca3af">${escapeXml(posterData.plate)}</text>
  ` : `
    <text x="540" y="${contentCardY + (isSquare ? 260 : 340)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 26 : 30}" font-weight="600" fill="#6b7280">🚗 ${escapeXml(posterData.vehicleLine)} • ${escapeXml(posterData.plate)}</text>
  `}

  <rect x="340" y="${contentCardY + (isSquare ? 330 : 430)}" width="400" height="${isSquare ? 140 : 170}" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="3"/>
  <image xlink:href="${qrImg}" x="375" y="${contentCardY + (isSquare ? 340 : 445)}" width="${isSquare ? 120 : 140}" height="${isSquare ? 120 : 140}" preserveAspectRatio="xMidYMid meet"/>
  <text x="530" y="${contentCardY + (isSquare ? 400 : 510)}" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#1f2937">SCAN TO</text>
  <text x="530" y="${contentCardY + (isSquare ? 435 : 550)}" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#059669">BOOK NOW</text>

  <text x="540" y="${contentCardY + (isSquare ? 500 : 640)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 28}" font-weight="700" fill="#1f2937">📞 ${escapeXml(posterData.phone)}</text>

  ${displayRoutes.length > 0 ? `
  <!-- Route Prices Section -->
  <rect x="150" y="${routeCardY}" width="780" height="${routeCardHeight}" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="2"/>
  <text x="540" y="${routeCardY + 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#059669">💰 POPULAR ROUTES</text>
  ${displayRoutes.map((rp, idx) => `
    <text x="180" y="${routeCardY + 75 + idx * routeRowHeight}" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#1f2937">${escapeXml(rp.route)}</text>
    <text x="900" y="${routeCardY + 75 + idx * routeRowHeight}" text-anchor="end" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#059669">KES ${rp.price.toLocaleString()}</text>
  `).join('')}
  ` : ''}

  <rect x="0" y="${bottomBarY}" width="${w}" height="${bottomBarHeight}" fill="#1f2937"/>
  <text x="540" y="${bottomBarY + (isSquare ? 65 : 75)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 26 : 32}" font-weight="700" fill="#10b981">💬 wa.me/${escapeXml(posterData.whatsapp)}</text>
</svg>`;
  };

  const generateMinimalSVG = () => {
    if (!posterData) return "";
    const profileImg = embeddedImages.profilePhoto;
    const qrImg = embeddedImages.qrCode;
    const vehicleImg = embeddedImages.vehiclePhoto;

    // Dynamic layout calculations
    const isSquare = h === 1080;
    const isStory = h === 1920;

    const headerHeight = isSquare ? 130 : isStory ? 240 : 180;
    const bottomBarHeight = isSquare ? 100 : isStory ? 160 : 120;
    const bottomBarY = h - bottomBarHeight;

    const contentCardY = isSquare ? 150 : isStory ? 270 : 200;
    const contentCardHeight = isSquare ? 600 : isStory ? 1100 : 800;

    const maxRoutes = isSquare ? 2 : isStory ? 4 : 3;
    const displayRoutes = routePrices.slice(0, maxRoutes);
    const routeRowHeight = 40;
    const routeCardY = contentCardY + contentCardHeight + (isSquare ? 15 : 30);
    const routeCardHeight = displayRoutes.length > 0 ? (displayRoutes.length * routeRowHeight + 60) : 0;
    
    // Y positions inside content card
    const photoY = contentCardY + (isSquare ? 30 : 50);
    const photoSize = isSquare ? 200 : 260;
    const photoX = (1080 - photoSize) / 2;

    const nameY = photoY + photoSize + (isSquare ? 45 : 65);
    const vehicleY = nameY + (isSquare ? 70 : 100);
    const phoneY = vehicleY + (isSquare ? 60 : 90);
    const qrY = phoneY + (isSquare ? 30 : 50);
    const qrSize = isSquare ? 150 : 180;
    const qrX = (1080 - qrSize) / 2;

    // Font sizes
    const nameSize = isSquare ? 38 : isStory ? 54 : 46;
    const ratingSize = isSquare ? 22 : isStory ? 30 : 26;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <clipPath id="minPhoto"><rect x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoSize}" rx="20"/></clipPath>
  </defs>
  
  <rect fill="#f8fafc" width="${w}" height="${h}"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="${w}" height="${headerHeight}" fill="#16a34a"/>
  <text x="540" y="${headerHeight * 0.65}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 60 : 80}" font-weight="900" fill="#ffffff">TaxiTao</text>

  <!-- Content Card -->
  <rect x="120" y="${contentCardY}" width="840" height="${contentCardHeight}" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  
  <!-- Driver Photo -->
  <image xlink:href="${profileImg}" x="${photoX}" y="${photoY}" width="${photoSize}" height="${photoSize}" clip-path="url(#minPhoto)" preserveAspectRatio="xMidYMid slice"/>
  
  <text x="540" y="${nameY}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${nameSize}" font-weight="900" fill="#1f2937">${escapeXml(posterData.name)}</text>
  <text x="540" y="${nameY + (isSquare ? 35 : 45)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${ratingSize}" font-weight="600" fill="#16a34a">★ ${posterData.rating.toFixed(1)} • ${escapeXml(posterData.baseLocation)}</text>
  
  <line x1="220" y1="${vehicleY - 20}" x2="860" y2="${vehicleY - 20}" stroke="#e5e7eb" stroke-width="2"/>
  
  ${vehicleImg ? `
    <image xlink:href="${vehicleImg}" x="220" y="${vehicleY}" width="100" height="75" rx="8" preserveAspectRatio="xMidYMid slice"/>
    <text x="340" y="${vehicleY + 35}" font-family="system-ui, sans-serif" font-size="${isSquare ? 22 : 26}" font-weight="700" fill="#4b5563">🚗 ${escapeXml(posterData.vehicleLine)}</text>
    <text x="340" y="${vehicleY + 65}" font-family="system-ui, sans-serif" font-size="${isSquare ? 18 : 22}" font-weight="600" fill="#9ca3af">${escapeXml(posterData.plate)}</text>
  ` : `
    <text x="540" y="${vehicleY + 35}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 28}" font-weight="700" fill="#4b5563">🚗 ${escapeXml(posterData.vehicleLine)}</text>
  `}
  
  <text x="540" y="${phoneY}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 28}" font-weight="700" fill="#16a34a">📞 ${escapeXml(posterData.phone)}</text>

  <rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" rx="12" fill="#ffffff" stroke="#16a34a" stroke-width="2"/>
  <image xlink:href="${qrImg}" x="${qrX + 10}" y="${qrY + 10}" width="${qrSize - 20}" height="${qrSize - 20}" preserveAspectRatio="xMidYMid meet"/>
  
  ${displayRoutes.length > 0 ? `
  <!-- Route Prices Section -->
  <rect x="180" y="${routeCardY}" width="720" height="${routeCardHeight}" rx="16" fill="#ffffff" stroke="#e5e7eb" stroke-width="2"/>
  <text x="540" y="${routeCardY + 40}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#16a34a">💰 Popular Routes</text>
  ${displayRoutes.map((rp, idx) => `
    <g>
      <line x1="200" y1="${routeCardY + 65 + idx * routeRowHeight}" x2="880" y2="${routeCardY + 65 + idx * routeRowHeight}" stroke="#f3f4f6" stroke-width="1"/>
      <text x="200" y="${routeCardY + 90 + idx * routeRowHeight}" font-family="system-ui, sans-serif" font-size="18" font-weight="600" fill="#4b5563">${escapeXml(rp.route)}</text>
      <text x="880" y="${routeCardY + 90 + idx * routeRowHeight}" text-anchor="end" font-family="system-ui, sans-serif" font-size="22" font-weight="900" fill="#16a34a">KES ${rp.price.toLocaleString()}</text>
    </g>
  `).join('')}
  ` : ''}
  
  <rect x="0" y="${bottomBarY}" width="${w}" height="${bottomBarHeight}" fill="#1f2937"/>
  <text x="540" y="${bottomBarY + (isSquare ? 55 : 75)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${isSquare ? 24 : 28}" font-weight="700" fill="#10b981">taxitao.co.ke</text>
</svg>`;
  };

  // ─── Car Window Sticker Generator ────────────────────────────────────────────
  // Fixed 1200×1200. High-contrast dark green / white for crisp vinyl printing.
  // Prominently features the QR code (customers scan to book — no phone needed).
  const generateStickerSVG = () => {
    if (!posterData) return "";
    const safeName = escapeXml(posterData.name);
    const safeVehicle = escapeXml(posterData.vehicleLine);
    const safeLoc   = escapeXml(posterData.baseLocation);
    const qrImg      = embeddedImages.qrCode;
    const profileImg = embeddedImages.profilePhoto;

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="stkBg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#064e3b"/>
      <stop offset="100%" stop-color="#065f46"/>
    </linearGradient>
    <linearGradient id="stkAccent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#FCD34D"/>
      <stop offset="100%" stop-color="#FBBF24"/>
    </linearGradient>
    <clipPath id="stkAvatar">
      <circle cx="600" cy="188" r="70"/>
    </clipPath>
    <filter id="stkShadow" x="-8%" y="-8%" width="116%" height="116%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="1200" fill="url(#stkBg)"/>

  <!-- Outer decorative ring -->
  <circle cx="600" cy="600" r="570" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.12"/>
  <circle cx="600" cy="600" r="530" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.08"/>

  <!-- Corner accent blobs -->
  <circle cx="80"  cy="80"   r="120" fill="#ffffff" opacity="0.04"/>
  <circle cx="1120" cy="1120" r="120" fill="#ffffff" opacity="0.04"/>

  <!-- ── TOP BRAND BAR ── -->
  <rect x="0" y="0" width="1200" height="110" fill="#000000" opacity="0.28"/>
  <text x="600" y="72" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-1">TaxiTao</text>

  <!-- ── DRIVER AVATAR ── -->
  <circle cx="600" cy="188" r="76" fill="#16a34a" stroke="#FCD34D" stroke-width="5"/>
  <image xlink:href="${profileImg}" x="530" y="118" width="140" height="140" clip-path="url(#stkAvatar)" preserveAspectRatio="xMidYMid slice"/>

  <!-- ── DRIVER NAME ── -->
  <text x="600" y="310" text-anchor="middle" font-family="system-ui,sans-serif" font-size="52" font-weight="900" fill="#ffffff">${safeName}</text>

  <!-- ── VEHICLE LINE ── -->
  <text x="600" y="365" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="600" fill="#6ee7b7">🚗 ${safeVehicle}</text>

  <!-- ── LOCATION ── -->
  <text x="600" y="410" text-anchor="middle" font-family="system-ui,sans-serif" font-size="26" font-weight="500" fill="#a7f3d0">📍 ${safeLoc}</text>

  <!-- ── QR CODE CARD ── -->
  <rect x="175" y="440" width="850" height="580" rx="40" fill="#ffffff" filter="url(#stkShadow)"/>
  <image xlink:href="${qrImg}" x="200" y="460" width="800" height="520" preserveAspectRatio="xMidYMid meet"/>

  <!-- ── SCAN CTA BADGE ── -->
  <rect x="330" y="1050" width="540" height="72" rx="36" fill="url(#stkAccent)"/>
  <text x="600" y="1096" text-anchor="middle" font-family="system-ui,sans-serif" font-size="32" font-weight="900" fill="#1f2937">📱 SCAN TO BOOK A RIDE</text>

  <!-- ── BOTTOM URL ── -->
  <text x="600" y="1160" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#a7f3d0">taxitao.co.ke</text>
</svg>`;
  };

  const posterSvgString = useMemo(() => {
    if (loadingImages || !embeddedImages.qrCode) return "";
    if (template === "transformation") return generateTransformationSVG();
    if (template === "bold") return generateBoldSVG();
    if (template === "sticker")  return generateStickerSVG();
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
      
      // Sticker uses a fixed 1200×1200 canvas; all other templates use the selected size
      const exportW = template === "sticker" ? STICKER_DIMENSION.w : w;
      const exportH = template === "sticker" ? STICKER_DIMENSION.h : h;

      const canvas = document.createElement("canvas");
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportW, exportH);
      ctx.drawImage(img, 0, 0, exportW, exportH);
      URL.revokeObjectURL(url);
      
      const pngBlob: Blob | null = await new Promise((resolve) => 
        canvas.toBlob(resolve, "image/png", 1)
      );
      
      if (!pngBlob) throw new Error("PNG export failed");
      const sizeLabel = template === "sticker" ? "1200x1200" : size;
      downloadBlob(pngBlob, `taxitao-poster-${template}-${sizeLabel}.png`);
    } catch (e: any) {
      logError("page", e);
      setExportError(`Export failed: ${e.message}. Try SVG instead.`);
    } finally {
      setExportingPng(false);
    }
  };

  if (loading || !driverProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-md hover:shadow-lg"
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
            <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-primary-600" />
              <p className="font-semibold text-primary-900 text-sm">All images embedded! Ready to download.</p>
            </div>
          )}

          {/* Template Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              Choose Template
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(TEMPLATES) as PosterTemplate[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium border transition-all text-left ${
                    template === t
                      ? "bg-primary-50 border-primary-600 text-primary-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="font-bold">{TEMPLATES[t].name}</div>
                  <div className="text-xs opacity-75">{TEMPLATES[t].description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection — hidden when Car Sticker template is active (fixed 1200×1200) */}
          {template !== "sticker" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-bold text-gray-900 mb-3">Poster Size</h2>
              <div className="grid grid-cols-1 gap-2">
                {(Object.keys(SIZES) as PosterSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      size === s
                        ? "bg-primary-50 border-primary-600 text-primary-700 shadow-sm"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {SIZES[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {/* Sticker fixed-size notice */}
          {template === "sticker" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
              <p className="font-bold mb-1">📐 Fixed Dimension</p>
              <p className="text-xs text-emerald-700">
                Car Window Stickers are always exported at <strong>1200×1200 px</strong> — the optimal square format for vinyl printing at any size.
              </p>
            </div>
          )}

          {/* QR Destination Toggle */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-bold text-gray-900 mb-3">QR Code Destination</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setQrDestination("profile")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  qrDestination === "profile"
                    ? "bg-primary-50 border-primary-600 text-primary-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Booking Page
              </button>
              <button
                onClick={() => setQrDestination("app")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  qrDestination === "app"
                    ? "bg-primary-50 border-primary-600 text-primary-700 shadow-sm"
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
            <div className="w-full bg-gray-100 flex items-center justify-center p-4 md:p-6 min-h-[500px]">
              {loadingImages ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Loading your poster...</p>
                  <p className="text-sm text-gray-500 mt-2">Embedding images for offline use</p>
                </div>
              ) : posterSvgString ? (
                <div
                  className="w-full max-h-[75vh] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[72vh] [&>svg]:shadow-2xl [&>svg]:rounded-lg overflow-hidden"
                  // SVG is safe: all user-supplied strings go through escapeXml() before
                  // injection. DOMPurify was removed because it strips valid SVG attributes
                  // (xlink:href on <image>, filter, clipPath) that are required for poster rendering.
                  dangerouslySetInnerHTML={{ __html: posterSvgString }}
                />
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
