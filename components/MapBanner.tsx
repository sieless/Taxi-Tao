"use client";

import { useState, useEffect } from 'react';
import { Shield, Info, Star, MapPin } from 'lucide-react';
import Image from 'next/image';

const TIPS = [
  {
    icon: <Shield className="w-8 h-8 text-green-500" />,
    title: "Safety First",
    text: "Always verify the driver's name and car plate number before boarding.",
    color: "bg-green-50",
    image: "/images/posters/safety.png" // User can place their custom photo here
  },
  {
    icon: <Info className="w-8 h-8 text-blue-500" />,
    title: "Share Your Trip",
    text: "Use the 'Share Status' feature to let friends know your location in real-time.",
    color: "bg-blue-50",
    image: "/images/posters/share.png"
  },
  {
    icon: <Star className="w-8 h-8 text-orange-500" />,
    title: "Rate Your Experience",
    text: "Your feedback helps us maintain the highest standards of service in TaxiTao.",
    color: "bg-orange-50",
    image: "/images/posters/rating.png"
  },
  {
    icon: <MapPin className="w-8 h-8 text-red-500" />,
    title: "Reliable Coverage",
    text: "Proudly serving Machakos, Kitui, and Makueni with 24/7 availability.",
    color: "bg-red-50",
    image: "/images/posters/coverage.png"
  }
];

export default function MapBanner() {
  const [currentTip, setCurrentTip] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
        setFade(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const tip = TIPS[currentTip];

  return (
    <div className={`w-full h-full min-h-[400px] relative flex flex-col items-center justify-center p-8 rounded-xl transition-colors duration-1000 ${tip.color} border-2 border-dashed border-gray-200 overflow-hidden`}>
      {/* Background Image (Full Poster Mode) */}
      {tip.image && (
        <div className={`absolute inset-0 z-0 transition-opacity duration-500 ${fade ? 'opacity-20' : 'opacity-0'}`}>
          <img 
            src={tip.image} 
            alt={tip.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image doesn't exist yet
          />
        </div>
      )}

      <div className={`relative z-10 text-center transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
        <div className="mb-6 flex justify-center transform scale-125">
          {tip.icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">{tip.title}</h3>
        <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed">
          {tip.text}
        </p>
      </div>
      
      <div className="mt-12 flex gap-2">
        {TIPS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${i === currentTip ? 'w-8 bg-gray-800' : 'w-2 bg-gray-300'}`}
          />
        ))}
      </div>

      <div className="absolute bottom-6 text-xs text-gray-400 font-medium tracking-widest uppercase">
        TaxiTao • Premium Transportation
      </div>
    </div>
  );
}
