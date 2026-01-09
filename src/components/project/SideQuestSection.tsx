import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../../sanity/client";
import { useScrollLock } from "../../utils/useScrollLock";
import type { SanityImage } from "../../sanity/types";

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

  // Lock body scroll when modal is open
  useScrollLock(isExpanded);

  // Handle escape key to close expanded view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  return (
    <div className="px-8 md:px-[8%] xl:px-[175px] py-16 w-full">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr] gap-12 md:gap-0">
        {/* Left side: Label, Title, Subtitle, Image */}
        <div className="flex flex-col gap-12 md:col-start-1">
          {/* Header */}
          <div className="flex flex-col">
            {label && (
              <p className="text-[#9ca3af] text-base pb-2">{label}</p>
            )}
            {title && (
              <h3 className="text-2xl text-black">{renderHighlightedText(title, highlightedText, highlightColor)}</h3>
            )}
            {subtitle && (
              <p className="text-gray-500 text-xl">{subtitle}</p>
            )}
          </div>

          {/* Tilted Image - clickable to expand */}
          {image && (
            <div className="mt-8">
              <div 
                className="relative inline-block transform -rotate-2 transition-transform hover:rotate-0 duration-300 cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <img
                  src={urlFor(image).width(600).url()}
                  alt={title}
                  className="w-full max-w-[320px] h-auto rounded-lg"
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
                <p className="text-[#9ca3af] text-base">{teamLabel}</p>
              )}
              <div className="flex flex-col">
                {teamMembers.map((member) => (
                  <div key={member._key}>
                    {member.link ? (
                      <a
                        href={member.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 underline decoration-white underline-offset-2 hover:decoration-gray-300 transition-colors transition-100ms"
                      >
                        {member.name}
                      </a>
                    ) : (
                      <span className="text-gray-500  underline decoration-[#d1d5db] underline-offset-2">
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
            <div className="leading-normal text-gray-700 prose prose-p:my-4 first:prose-p:mt-0 last:prose-p:mb-0">
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
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-[fadeIn_200ms_ease-out]"
            onClick={() => setIsExpanded(false)}
          >
            {/* Light grey translucent overlay */}
            <div className="absolute inset-0 bg-gray-100/95" />

            {/* Close button - fixed to top right of screen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="fixed right-4 top-4 z-[10000] flex h-10 w-10 items-center justify-center transition-all duration-200 hover:scale-110 animate-[fadeSlideDown_300ms_ease-out]"
              aria-label="Close expanded image"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 1L13 13M1 13L13 1"
                  stroke="#9ca3af"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Expanded image container */}
            <div
              className="relative z-10 flex max-h-[85vh] max-w-[90vw] flex-col items-center animate-[scaleIn_300ms_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image - no additional border/shadow since image already has it */}
              <img
                src={urlFor(image).width(1200).url()}
                alt={title}
                className="max-h-[70vh] w-auto object-contain"
              />
              
              {/* Caption - only shown in popup mode */}
              {imageCaption && (
                <p
                  className="mt-6 max-w-[600px] text-center font-['DM_Sans'] text-base font-normal leading-relaxed text-gray-600 animate-[fadeSlideUp_300ms_ease-out_100ms_both]"
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
