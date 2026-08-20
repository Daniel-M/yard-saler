import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ImageCarouselProps {
  images: string[];
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({ images }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevSlide = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images]);

  const nextSlide = useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === containerRef.current) {
        if (e.key === "ArrowLeft") {
          prevSlide();
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          nextSlide();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevSlide, nextSlide]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-slate-900 flex items-center justify-center text-slate-500 rounded-t-lg">
        No Image Available
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Product Images"
      className="relative w-full h-48 bg-slate-950 overflow-hidden group focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none rounded-t-lg"
    >
      <img
        src={images[currentIndex]}
        alt={t("yard_sale.carousel.image_index", { index: currentIndex + 1, total: images.length })}
        className="w-full h-full object-cover"
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            aria-label={t("yard_sale.carousel.prev")}
            className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition duration-150 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            aria-label={t("yard_sale.carousel.next")}
            className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-900/80 text-white rounded-full hover:bg-slate-800 transition duration-150 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                aria-label={`Go to slide ${idx + 1}`}
                className={`w-2 h-2 rounded-full transition duration-150 min-w-[12px] min-h-[12px] ${
                  idx === currentIndex ? "bg-cyan-500" : "bg-slate-500/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
