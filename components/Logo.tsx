import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon-only' | 'text-only';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  clickable?: boolean;
}

const sizeMap = {
  sm: { height: 24, width: 24, textSize: 'text-lg' },
  md: { height: 40, width: 40, textSize: 'text-2xl' },
  lg: { height: 64, width: 64, textSize: 'text-4xl' },
  xl: { height: 96, width: 96, textSize: 'text-5xl' },
};

export default function Logo({ 
  variant = 'full', 
  size = 'md', 
  className = '',
  clickable = true 
}: LogoProps) {
  const { height, width, textSize } = sizeMap[size];
  
  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon */}
      {variant !== 'text-only' && (
        <div className="relative" style={{ width, height }}>
          <Image
            src="/icon.png"
            alt="TaxiTao Logo"
            width={width}
            height={height}
            className="rounded-lg shadow-sm"
            priority
          />
        </div>
      )}
      
      {/* Text */}
      {variant !== 'icon-only' && (
        <span 
          className={`font-bold text-green-600 ${textSize}`}
          style={{ letterSpacing: '-0.02em' }}
        >
          TaxiTao
        </span>
      )}
    </div>
  );

  if (clickable) {
    return (
      <Link href="/" className="hover:opacity-80 transition">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
