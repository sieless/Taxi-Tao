"use client";

import { Star } from 'lucide-react';
import { useState } from 'react';

interface RatingComponentProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

export default function RatingComponent({
  value,
  onChange,
  size = 'md',
  readonly = false,
}: RatingComponentProps) {
  const [hoverValue, setHoverValue] = useState<number>(0);

  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const handleClick = (rating: number) => {
    if (!readonly) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(0);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= (hoverValue || value);
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            className={`transition-all ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              className={`${sizes[size]} ${
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              } transition-colors`}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          {value} / 5
        </span>
      )}
    </div>
  );
}
