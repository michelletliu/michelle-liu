import React from "react";
import { urlFor } from "../../sanity/client";
import type { SanityImage } from "../../sanity/types";

interface ProjectCard {
  _key: string;
  label?: string;
  emoji?: string;
  title: string;
  image?: SanityImage;
}

interface ProjectCardSectionProps {
  cards: ProjectCard[];
}

function SingleProjectCard({ card }: { card: ProjectCard }) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 py-12">
      {/* Left side: Label and Title */}
      <div className="flex flex-col gap-3">
        {card.label && (
          <p className="text-[#9ca3af] text-sm font-normal tracking-wide uppercase">
            {card.label}
          </p>
        )}
        <p className="text-xl font-normal text-[#111827]">
          {card.emoji && <span className="mr-2">{card.emoji}</span>}
          {card.title}
        </p>
      </div>

      {/* Right side: Image */}
      {card.image && (
        <div className="relative flex-shrink-0 w-full md:w-[340px] lg:w-[390px] rounded-[26px] overflow-hidden">
          <img
            src={urlFor(card.image).width(780).url()}
            alt={card.title}
            className="w-full h-auto object-cover rounded-[26px]"
          />
        </div>
      )}
    </div>
  );
}

export default function ProjectCardSection({ cards }: ProjectCardSectionProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="flex flex-col px-8 md:px-[8%] xl:px-[175px] py-8">
      {cards.map((card) => (
        <SingleProjectCard key={card._key} card={card} />
      ))}
    </div>
  );
}
