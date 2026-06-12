"use client";

import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableRowProps {
  children: ReactNode;
  className?: string;
  itemWidth?: number;
}

export default function ScrollableRow({ children, className = "" }: ScrollableRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 340;
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
  };

  return (
    <div className={`relative group/scroll ${className}`}>
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all opacity-0 group-hover/scroll:opacity-100 -translate-x-1/2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex gap-6 min-w-min px-1">
          {children}
        </div>
      </div>

      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#fafafa] to-transparent z-10 pointer-events-none" />
      )}

      {canScrollRight && (
        <>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-white transition-all opacity-0 group-hover/scroll:opacity-100 translate-x-1/2"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#fafafa] to-transparent z-10 pointer-events-none" />
        </>
      )}
    </div>
  );
}
