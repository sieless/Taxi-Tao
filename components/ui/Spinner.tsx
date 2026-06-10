import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  size?: number;
}

export default function Spinner({ className = "", size = 20 }: SpinnerProps) {
  return (
    <Loader2
      className={`animate-spin text-gray-400 ${className}`}
      size={size}
      aria-label="Loading"
      role="status"
    />
  );
}
