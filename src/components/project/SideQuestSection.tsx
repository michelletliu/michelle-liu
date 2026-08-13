import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { PortableText } from "@portabletext/react";
import ShimmerImage from "../shared/ShimmerImage";
import { urlFor } from "../../sanity/client";
import { useScrollLock } from "../../utils/useScrollLock";
import type { SanityImage } from "../../sanity/types";
import { Close } from "../icons/Close";
import { ghostIconButtonClass } from "../shared/ghostIconButton";

interface TeamMember {
  _key: string;
  name: string;
  link?: string;
}

interface SideQuestSectionProps {
  label?: string;
  title: string;
  highlightedText?: string;
  highlightColor?: string;
  subtitle?: string;
  image?: SanityImage;
  imageCaption?: string;
  teamLabel?: string;
  teamMembers?: TeamMember[];
  description?: any[];
}

// Helper to render text with highlighted portion
function renderHighlightedText(text: string, highlightedText?: string, highlightColor?: string): React.ReactNode {
  if (!highlightedText) {
    return text;
  }
  const lowerText = text.toLowerCase();
  const lowerHighlight = highlightedText.toLowerCase();
  const index = lowerText.indexOf(lowerHighlight);
  
  if (index === -1) {
    return text;
  }
  
  const before = text.substring(0, index);
  const match = text.substring(index, index + highlightedText.length);
  const after = text.substring(index + highlightedText.length);
  const color = highlightColor || '#3b82f6';
  
  return (
    <>
      {before}
      <span style={{ color }}>{match}</span>
      {after}
    </>
  );
}

export default function SideQuestSection({
  label,
  title,
  highlightedText,
  highlightColor,
  subtitle,
  image,
  imageCaption,
  teamLabel,
  teamMembers,
  description,
}: SideQuestSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useScrollLock(isExpanded);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
    }, 200);
  }, [isClosing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        handleClose();
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded, handleClose]);

  return (
    <div className="px-8 py-16 w-full">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-12 md:gap-0">
        {/* Left side: Label, Title, Subtitle, Image */}
        <div className="flex flex-col gap-12 md:col-start-1">
          {/* Header */}
          <div className="flex flex-col">
            {label && (
              <p className="text-[#a1a1aa] uppercase text-base pb-2">{label}</p>
            )}
            {title && (
              <h3 className="text-2xl text-zinc-900">{renderHighlightedText(title, highlightedText, highlightColor)}</h3>
            )}
            {subtitle && (
              <p className="text-zinc-500 text-xl">{subtitle}</p>
            )}
          </div>

          {/* Tilted Image - clickable to expand */}
          {image && (
            <div className="mt-8 px-4">
              <div 
                className="relative inline-block transform -rotate-2 transition-transform hover:rotate-0 duration-300 cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <ShimmerImage
                  src={urlFor(image).width(600).url()}
                  alt={title}
                  rounded="rounded-lg"
                  className="w-full max-w-[320px] h-auto"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side: Team and Description */}
        <div className="flex flex-col gap-16 md:col-start-3">
          {/* Team Section */}
          {teamMembers && teamMembers.length > 0 && (
            <div className="flex flex-col gap-2">
              {teamLabel && (
                <p className="text-[#a1a1aa] uppercase text-base">{teamLabel}</p>
              )}
              <div className="flex flex-col">
                {teamMembers.map((member) => (
                  <div key={member._key}>
                    {member.link ? (
                      <a
                        href={member.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 underline decoration-white underline-offset-2 hover:decoration-zinc-300 transition-colors transition-100ms"
                      >
                        {member.name}
                      </a>
                    ) : (
                      <span className="text-zinc-500  underline decoration-[#d4d4d8] underline-offset-2">
                        {member.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && description.length > 0 && (
            <div className="leading-normal text-zinc-700 prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
              <PortableText 
                value={description}
                components={{
                  block: {
                    normal: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                  },
                  hardBreak: () => <br />,
                  marks: {
                    link: ({ value, children }) => (
                      <a 
                        href={value?.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:opacity-70"
                      >
                        {children}
                      </a>
                    ),
                  },
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal - renders via portal to cover entire page */}
      {isExpanded && image &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${isClosing ? 'opacity-0' : 'animate-[fadeIn_200ms_ease-out]'}`}
            onClick={handleClose}
          >
            <div className="absolute inset-0 bg-zinc-100/95" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className={`${ghostIconButtonClass("sm", "fixed right-4 top-4 z-[10000] text-zinc-500")} ${isClosing ? '' : 'animate-[fadeSlideDown_300ms_ease-out]'}`}
              aria-label="Close expanded image"
            >
              <Close size="12px" />
            </button>

            <div
              className={`relative z-10 flex max-h-[85vh] max-w-[90vw] flex-col items-center transition-all duration-200 ease-out ${isClosing ? 'opacity-0 scale-95' : 'animate-[scaleIn_300ms_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <ShimmerImage
                src={urlFor(image).width(1200).url()}
                alt={title}
                className="max-h-[70vh] w-auto object-contain"
              />
              
              {imageCaption && (
                <p
                  className={`mt-6 max-w-[600px] text-center font-['Michelle'] text-base font-normal leading-relaxed text-zinc-600 ${isClosing ? '' : 'animate-[fadeSlideUp_300ms_ease-out_100ms_both]'}`}
                  style={{ fontVariationSettings: "'opsz' 9" }}
                >
                  {imageCaption}
                </p>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
