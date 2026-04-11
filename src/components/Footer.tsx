import React, { useEffect, useState } from "react";
import svgPaths from "../imports/svg-2tsxp86msm";
import imgFinalSealLogo1 from "../assets/logo.png";
import LumaLogo from "../assets/LumaLogo.svg";
import { imgGroup } from "../imports/svg-poktt";
import { ScrollReveal } from "./ScrollReveal";
import { ArrowUpRight } from "./ArrowUpRight";
import { client } from "../sanity/client";
import { OWNER_LOCATION_QUERY } from "../sanity/queries";
import type { OwnerLocation } from "../sanity/types";
import TextScramble from "./TextScramble";
import { SocialLinksBackgroundImage, LinksBackgroundImageAndText } from "./SocialLinks";

type ChangelogPayload = {
  latestCommitDate?: string | null;
};

// Hook to fetch latest commit date from generated local changelog file
function useLatestCommitDate() {
  const [commitDate, setCommitDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestCommit = async () => {
      try {
        const response = await fetch('/changelog.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to fetch');

        const payload = (await response.json()) as ChangelogPayload;
        if (payload?.latestCommitDate) {
          setCommitDate(payload.latestCommitDate);
        }
      } catch (error) {
        console.error('Failed to fetch latest commit date:', error);
        // Keep null to show fallback
      }
    };

    fetchLatestCommit();
  }, []);

  return commitDate;
}

const DEFAULT_CITY = "Los Angeles";
const DEFAULT_TIMEZONE = "America/Los_Angeles";

function useOwnerLocation() {
  const [location, setLocation] = useState<{ city: string; timezone: string }>({
    city: DEFAULT_CITY,
    timezone: DEFAULT_TIMEZONE,
  });

  useEffect(() => {
    client
      .fetch<OwnerLocation | null>(OWNER_LOCATION_QUERY)
      .then((data) => {
        if (data?.city && data?.timezone) {
          setLocation({ city: data.city, timezone: data.timezone });
        }
      })
      .catch(() => {});
  }, []);

  return location;
}

function useLocalTime(timezone: string) {
  const format = (tz: string) => {
    const raw = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
    const [hStr, mStr] = raw.split(":");
    const h24 = parseInt(hStr, 10);
    const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const ampm = h24 >= 12 ? "PM" : "AM";
    return { formatted: `${h12}:${mStr} ${ampm}`, h24 };
  };

  const [state, setState] = useState<{ formatted: string; h24: number } | null>(null);

  useEffect(() => {
    setState(format(timezone));
    const id = setInterval(() => setState(format(timezone)), 1000);
    return () => clearInterval(id);
  }, [timezone]);

  return state;
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3.5" />
      <line x1="8" y1="0.5" x2="8" y2="2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="13.5" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15.5" y1="8" x2="13.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2.5" y1="8" x2="0.5" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.3" y1="2.7" x2="11.89" y2="4.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.11" y1="11.89" x2="2.7" y2="13.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="13.3" y1="13.3" x2="11.89" y2="11.89" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="4.11" y1="4.11" x2="2.7" y2="2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 9.27A6.5 6.5 0 1 1 6.73 2 5.5 5.5 0 0 0 14 9.27Z" />
    </svg>
  );
}

function BlinkingTime({ time, h24, city }: { time: string; h24: number; city: string }) {
  if (!time) return null;
  const isDay = h24 >= 6 && h24 < 18;
  const icon = isDay
    ? <SunIcon className="inline-block w-[11px] h-[11px] -mt-[2px] mr-1" />
    : <MoonIcon className="inline-block w-[11px] h-[11px] -mt-[2px] mr-1" />;
  const colonIndex = time.indexOf(":");
  if (colonIndex === -1) return <>{icon}{time}, {city}</>;
  const before = time.slice(0, colonIndex);
  const after = time.slice(colonIndex + 1);
  return (
    <>
      {icon}
      {before}
      <span className="animate-[blink_1.2s_ease-in-out_infinite]">:</span>
      {after}, {city}
    </>
  );
}

export default function Footer() {
  const latestCommitDate = useLatestCommitDate();
  const changelogText = latestCommitDate 
    ? `CHANGELOG: ${latestCommitDate}` 
    : 'CHANGELOG: ...';
  const { city, timezone } = useOwnerLocation();
  const timeData = useLocalTime(timezone);
  const localTime = timeData?.formatted ?? "";
  const localH24 = timeData?.h24 ?? 12;

  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-16 items-center px-16 max-md:px-6 pt-8 pb-8 max-md:pb-16 max-md:pt-4 relative w-full">
          <ScrollReveal className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
            <div className="bg-zinc-100 h-px shrink-0 w-full" />
            
            {/* Desktop Grid (4 columns) */}
            <div className="hidden md:grid gap-5 grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(1,_fit-content(100%))] relative shrink-0 w-full">
              {/* Column 1: Logo + Time */}
              <div className="[grid-area:1_/_1] content-stretch flex flex-col gap-0 items-start relative shrink-0">
                <a href="/" className="content-stretch flex gap-3 items-center justify-center relative shrink-0 hover:opacity-80 transition-opacity">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src={imgFinalSealLogo1}
                    />
                  </div>
                  <p className="font-['Michelle',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </a>
                <p className="font-['Michelle',sans-serif] font-normal leading-5 text-[#b5bcc5] text-base">
                  <BlinkingTime time={localTime} h24={localH24} city={city} />
                </p>
              </div>
              
              {/* Column 3: Nav Links */}
              <div className="[grid-area:1_/_3] content-stretch flex flex-col gap-2 items-start relative shrink-0">
                <LinksBackgroundImageAndText text="Work" href="/" />
                <LinksBackgroundImageAndText text="Art" href="/art" />
                <LinksBackgroundImageAndText text="About" href="/about" />
              </div>
              
              {/* Column 4: Contact + Social */}
              <div className="[grid-area:1_/_4] content-stretch flex flex-col gap-4 items-start relative shrink-0">
                <div className="content-stretch flex flex-col font-['Michelle',sans-serif] font-normal items-start relative shrink-0 text-gray-400 w-full">
                  <p className="leading-6 min-w-full relative shrink-0 text-base w-[min-content]">Let's work together!</p>
                  <p className="leading-6 relative shrink-0 text-base break-all">
                    <a href="mailto:studio@liumichelle.com" className="group/email hover:text-blue-500 text-gray-600 font-medium transition-colors duration-200">
                      <span>{`studio@liumichelle.com`}</span>
                      <span className="font-['Michelle',sans-serif] font-bold ml-1 opacity-0 group-hover/email:opacity-100 transition-opacity duration-150 ease-out"><ArrowUpRight /></span>
                    </a>
                  </p>
                </div>
                <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0">
                  <div className="content-stretch flex gap-6 items-start relative shrink-0">
                    <a href="https://www.instagram.com/studio.mliu" target="_blank" rel="noopener noreferrer" className="social-link">
                      <SocialLinksBackgroundImage>
                        <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #c4c9d0)" id="Vector" />
                      </SocialLinksBackgroundImage>
                    </a>
                    <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
                        <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                          <div
                            className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]"
                            style={{ maskImage: `url('${imgGroup}')` }}
                          >
                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
                              <g id="Group">
                                <path d={svgPaths.p16308a80} fill="var(--fill-0, #c4c9d0)" id="Vector" />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </a>
                    <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link social-link-linkedin">
                      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
                        <SocialLinksBackgroundImage>
                          <path d={svgPaths.p1e086000} fill="var(--fill-0, #c4c9d0)" id="Vector" stroke="var(--stroke-0, #c4c9d0)" />
                        </SocialLinksBackgroundImage>
                      </div>
                    </a>
                    <a href="https://lu.ma/user/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                      <div className="content-stretch flex items-center justify-center relative shrink-0 size-6">
                        <img 
                          src={LumaLogo} 
                          alt="Luma" 
                          className="size-6 transition-opacity"
                          style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(5%) saturate(300%) hue-rotate(180deg) brightness(95%)' }}
                        />
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Layout (Vertical Stack) */}
            <div className="md:hidden content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
              {/* Logo Section + Time */}
              <div className="content-stretch flex flex-col gap-0 items-start relative shrink-0">
                <a href="/" className="content-stretch flex gap-2 items-center justify-center relative shrink-0 hover:opacity-80 transition-opacity">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src={imgFinalSealLogo1}
                    />
                  </div>
                  <p className="font-['Michelle',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </a>
                <p className="font-['Michelle',sans-serif] font-normal leading-5 text-[#b5bcc5] text-base">
                  <BlinkingTime time={localTime} h24={localH24} city={city} />
                </p>
              </div>
              
              {/* Contact + Social + Nav */}
              <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0">
                <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0">
                  <div className="content-stretch flex flex-col font-['Michelle',sans-serif] font-normal items-start relative shrink-0 text-gray-400 w-[326px]">
                    <p className="leading-6 relative shrink-0 text-base w-full">Let's work together!</p>
                    <p className="leading-6 relative shrink-0 text-base w-full break-all">
                      <a href="mailto:studio@liumichelle.com" className="group/email hover:text-blue-500 text-gray-600 font-medium transition-colors duration-200">
                        <span>{`studio@liumichelle.com`}</span>
                        <span className="font-['Michelle',sans-serif] font-bold ml-0 group-hover/email:ml-1.5 opacity-0 group-hover/email:opacity-100 transition-all duration-150 ease-out"><ArrowUpRight /></span>
                      </a>
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0 w-[326px]">
                    <div className="content-stretch flex gap-6 items-start relative shrink-0">
                      <a href="https://www.instagram.com/studio.mliu" target="_blank" rel="noopener noreferrer" className="social-link">
                        <SocialLinksBackgroundImage>
                          <path d={svgPaths.p2c5f2300} fill="var(--fill-0, #c4c9d0)" id="Vector" />
                        </SocialLinksBackgroundImage>
                      </a>
                      <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                        <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                            <div
                              className="[grid-area:1_/_1] h-[17.219px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px_-0.89px] mask-size-[19px_19px] ml-0 mt-[4.69%] relative w-[19px]"
                              style={{ maskImage: `url('${imgGroup}')` }}
                            >
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19 18">
                                <g id="Group">
                                  <path d={svgPaths.p16308a80} fill="var(--fill-0, #c4c9d0)" id="Vector" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                      <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link social-link-linkedin">
                        <div className="content-stretch flex items-center justify-center p-2.5 relative shrink-0 size-6">
                          <SocialLinksBackgroundImage>
                            <path d={svgPaths.p1e086000} fill="var(--fill-0, #c4c9d0)" id="Vector" stroke="var(--stroke-0, #c4c9d0)" />
                          </SocialLinksBackgroundImage>
                        </div>
                      </a>
                      <a href="https://lu.ma/user/michelletliu" target="_blank" rel="noopener noreferrer" className="social-link">
                        <img 
                          src={LumaLogo} 
                          alt="Luma" 
                          className="size-6 transition-opacity"
                          style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(5%) saturate(300%) hue-rotate(180deg) brightness(95%)' }}
                        />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0 w-[338px]">
                  <LinksBackgroundImageAndText text="WORK" href="/" />
                  <LinksBackgroundImageAndText text="ART" href="/art" />
                  <LinksBackgroundImageAndText text="ABOUT" href="/about" />
                </div>
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal variant="fade" delay={200} className="content-stretch flex flex-col gap-0.5 items-center relative shrink-0">
            <p className="font-['Michelle',sans-serif] font-normal leading-7 relative shrink-0 text-gray-400 text-sm">
              <span>{`Built with Next.js & `}</span>
              <span className="group">
                <a
                  className="[text-underline-position:from-font] cursor-pointer font-medium text-gray-600 group-hover:!text-emerald-600 transition-colors"
                  href="https://www.rockysmatcha.com/blogs/matcha-guide/how-to-make-matcha-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  rocky's matcha
                </a>
                <span>{` lattes.`}</span>
                <span className="text-gray-400">{` ☕︎`}</span>
              </span>
            </p>
            <a 
              href="https://github.com/michelletliu/michelle-liu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors"
            >
              <TextScramble 
                text={changelogText}
                className="font-['Michelle',sans-serif] font-normal leading-5 tracking-wider relative shrink-0 text-[#9ca3af] text-xs text-nowrap"
              />
            </a>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

