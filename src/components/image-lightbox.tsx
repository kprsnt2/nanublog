"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Calendar, ZoomIn } from "lucide-react";

interface LightboxImage {
  src: string;
  filename: string;
  dateFormatted: string;
  badge?: string; // optional badge text e.g. "Age 2"
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goNext = useCallback(() => {
    setIsLoading(true);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIsLoading(true);
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "Escape":
          onClose();
          break;
        case "p":
          setIsPlaying((prev) => !prev);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, goNext, goPrev, onClose]);

  // Slideshow auto-play
  useEffect(() => {
    if (isPlaying && isOpen) {
      slideshowRef.current = setInterval(goNext, 3000);
    }
    return () => {
      if (slideshowRef.current) clearInterval(slideshowRef.current);
    };
  }, [isPlaying, isOpen, goNext]);

  // Touch handling for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) goNext();
      else goPrev();
    }
  };

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      className="lightbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="lightbox-topbar">
        <div className="lightbox-counter">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="lightbox-controls">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="lightbox-btn"
            title="Toggle zoom"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="lightbox-btn"
            title={isPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={onClose} className="lightbox-btn" title="Close">
            <X size={22} />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div className="lightbox-main">
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="lightbox-nav lightbox-nav-left"
          aria-label="Previous image"
        >
          <ChevronLeft size={36} />
        </button>

        <div className={`lightbox-image-wrap ${isZoomed ? "lightbox-zoomed" : ""}`}>
          {isLoading && (
            <div className="lightbox-spinner">
              <div className="lightbox-spinner-ring"></div>
            </div>
          )}
          <img
            src={current.src}
            alt={current.filename}
            className="lightbox-image"
            style={{ opacity: isLoading ? 0 : 1 }}
            onLoad={() => setIsLoading(false)}
            draggable={false}
          />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="lightbox-nav lightbox-nav-right"
          aria-label="Next image"
        >
          <ChevronRight size={36} />
        </button>
      </div>

      {/* Bottom info bar */}
      <div className="lightbox-bottombar">
        {current.dateFormatted && (
          <div className="lightbox-date">
            <Calendar size={14} />
            <span>{current.dateFormatted}</span>
          </div>
        )}
        {current.badge && (
          <span className="lightbox-badge">{current.badge}</span>
        )}
      </div>

      {/* Slideshow progress */}
      {isPlaying && (
        <div className="lightbox-progress">
          <div className="lightbox-progress-bar" key={currentIndex}></div>
        </div>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="lightbox-thumbs">
          <div className="lightbox-thumbs-scroll">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  setIsZoomed(false);
                  setCurrentIndex(i);
                }}
                className={`lightbox-thumb ${i === currentIndex ? "lightbox-thumb-active" : ""}`}
              >
                <img src={img.src} alt="" loading="lazy" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
