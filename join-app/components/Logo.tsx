interface LogoProps {
  variant?: "full" | "icon-only" | "text-only";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: { height: 24, width: 24, textSize: "text-lg" },
  md: { height: 40, width: 40, textSize: "text-2xl" },
  lg: { height: 64, width: 64, textSize: "text-4xl" },
  xl: { height: 96, width: 96, textSize: "text-5xl" },
};

export default function Logo({
  variant = "full",
  size = "md",
  className = "",
}: LogoProps) {
  const { height, width, textSize } = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {variant !== "text-only" && (
        <img
          src="/icon.png"
          alt="TaxiTao Logo"
          width={width}
          height={height}
          className="rounded-lg shadow-sm"
        />
      )}
      {variant !== "icon-only" && (
        <span
          className={`font-bold text-primary-400 ${textSize}`}
          style={{ letterSpacing: "-0.02em" }}
        >
          TaxiTao
        </span>
      )}
    </div>
  );
}
