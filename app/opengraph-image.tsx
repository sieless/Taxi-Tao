import { ImageResponse } from "next/og";

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            fontSize: 100,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          TaxiTao
        </div>
        <div
          style={{
            fontSize: 36,
            fontWeight: 600,
            opacity: 0.9,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Kenya&apos;s Transport Ecosystem
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 22,
            fontWeight: 400,
            opacity: 0.75,
            marginBottom: 40,
          }}
        >
          <span>Taxi</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Car Hire</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Transport</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Hearse</span>
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 500,
            opacity: 0.5,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          taxitao.co.ke
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
