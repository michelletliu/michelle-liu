import React from "react";
import { PortableText } from "@portabletext/react";
import { urlFor } from "../../sanity/client";
import type { SanityImage } from "../../sanity/types";

interface TeamMember {
  _key: string;
  name: string;
  link?: string;
}

interface SideQuestSectionProps {
  label?: string;
  title: string;
  subtitle?: string;
  image?: SanityImage;
  teamLabel?: string;
  teamMembers?: TeamMember[];
  description?: any[];
}

export default function SideQuestSection({
  label,
  title,
  subtitle,
  image,
  teamLabel,
  teamMembers,
  description,
}: SideQuestSectionProps) {
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
              <h3 className="text-2xl text-black">{title}</h3>
            )}
            {subtitle && (
              <p className="text-gray-500 text-xl">{subtitle}</p>
            )}
          </div>

          {/* Tilted Image */}
          {image && (
            <div className="mt-8">
              <div className="relative inline-block transform -rotate-2 transition-transform hover:rotate-0 duration-300">
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
    </div>
  );
}
