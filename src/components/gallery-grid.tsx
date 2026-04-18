"use client";

import { useState } from "react";
import ImageLightbox from "./image-lightbox";

interface GalleryImage {
  src: string;
  filename: string;
  dateFormatted: string;
  badge?: string;
}

interface TimelineGroup {
  label: string;
  emoji: string;
  images: GalleryImage[];
}

interface GalleryGridProps {
  groups: TimelineGroup[];
  allImages: GalleryImage[];
}

export default function GalleryGrid({ groups, allImages }: GalleryGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (globalIndex: number) => {
    setLightboxIndex(globalIndex);
    setLightboxOpen(true);
  };

  // Calculate global index for each image
  let globalOffset = 0;

  return (
    <>
      <div className="gallery-timeline">
        {groups.map((group) => {
          const sectionOffset = globalOffset;
          globalOffset += group.images.length;
          return (
            <section key={group.label} className="gallery-timeline-section">
              {/* Timeline marker */}
              <div className="gallery-timeline-marker">
                <div className="gallery-timeline-dot">
                  <span>{group.emoji}</span>
                </div>
                <div className="gallery-timeline-label">
                  <h2>{group.label}</h2>
                  <span className="gallery-timeline-count">
                    {group.images.length} photo{group.images.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Masonry grid */}
              <div className="gallery-grid">
                {group.images.map((img, i) => (
                  <button
                    key={i}
                    className="gallery-card"
                    onClick={() => openLightbox(sectionOffset + i)}
                    aria-label={`View ${img.filename}`}
                  >
                    <div className="gallery-card-inner">
                      <img
                        src={img.src}
                        alt={img.filename}
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="gallery-card-overlay">
                        <div className="gallery-card-zoom">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            <line x1="11" y1="8" x2="11" y2="14" />
                            <line x1="8" y1="11" x2="14" y2="11" />
                          </svg>
                        </div>
                        {img.dateFormatted && (
                          <span className="gallery-card-date">{img.dateFormatted}</span>
                        )}
                        {img.badge && (
                          <span className="gallery-card-badge">{img.badge}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ImageLightbox
        images={allImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => {
          setLightboxOpen(false);
        }}
      />
    </>
  );
}
