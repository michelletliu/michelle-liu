import React, { useRef, useEffect } from "react";
import svgPaths from "../imports/svg-2tsxp86msm";
import imgFinalSealLogo1 from "../assets/logo.png";
import { imgGroup } from "../imports/svg-poktt";
import { ScrollReveal } from "./ScrollReveal";

// Text Scramble Component
type TextScrambleProps = {
  text: string;
  className?: string;
};

function TextScramble({ text, className }: TextScrambleProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const isAnimatingRef = useRef(false);
  const textRef = useRef(text);
  const hasAnimatedOnScrollRef = useRef(false);
  
  const chars = '!@#$%^&*()_+-;:,.<>?ADELPSTUadelpstu0123456789';

  // Keep text ref updated
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  // Run the scramble animation
  const runScrambleAnimation = () => {
    const el = elementRef.current;
    const targetText = textRef.current;
    if (!el || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const length = targetText.length;
    
    // Build queue for each character
    const queue: Array<{ to: string; start: number; end: number; char?: string }> = [];
    for (let i = 0; i < length; i++) {
      const to = targetText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ to, start, end });
    }
    
    let frame = 0;
    
    const update = () => {
      let output = '';
      let complete = 0;
      
      for (let i = 0; i < queue.length; i++) {
        const { to, start, end } = queue[i];
        
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!queue[i].char || Math.random() < 0.28) {
            queue[i].char = chars[Math.floor(Math.random() * chars.length)];
          }
          output += `<span style="color: #c4c4c4">${queue[i].char}</span>`;
        } else {
          output += to;
        }
      }
      
      el.innerHTML = output;
      
      if (complete === queue.length) {
        isAnimatingRef.current = false;
      } else {
        requestAnimationFrame(update);
        frame++;
      }
    };
    
    update();
  };

  // Handle hover to trigger scramble animation
  const handleMouseEnter = () => {
    runScrambleAnimation();
  };

  // Set up intersection observer for initial scroll animation
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedOnScrollRef.current) {
            hasAnimatedOnScrollRef.current = true;
            // Small delay before starting animation
            setTimeout(() => {
              runScrambleAnimation();
            }, 100);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <p 
      ref={elementRef} 
      className={`${className} cursor-pointer`}
      onMouseEnter={handleMouseEnter}
    >
      {text}
    </p>
  );
}

function SocialLinksBackgroundImage({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="relative shrink-0 size-6">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Social Links">{children}</g>
      </svg>
    </div>
  );
}

type LinksBackgroundImageAndTextProps = {
  text: string;
  href?: string;
};

function LinksBackgroundImageAndText({ text, href }: LinksBackgroundImageAndTextProps) {
  const content = (
    <p className={`font-['Figtree',sans-serif] leading-5 relative shrink-0 text-[#9ca3af] text-base text-nowrap tracking-[0.16px] ${href ? 'hover:text-blue-500 transition-colors duration-200' : ''}`}>
      {text}
    </p>
  );

  if (href) {
    return (
      <a href={href} className="content-stretch flex items-center justify-center px-0.5 py-0 relative rounded-full shrink-0">
        {content}
      </a>
    );
  }

  return (
    <div className="content-stretch flex items-center justify-center px-0.5 py-0 relative rounded-full shrink-0">
      {content}
    </div>
  );
}

export default function Footer() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-16 items-center px-16 max-md:px-8 pt-8 pb-8 max-md:pb-16 max-md:pt-4 relative w-full">
          <ScrollReveal className="content-stretch flex flex-col gap-5 items-start relative shrink-0 w-full">
            <div className="bg-gray-200 h-px shrink-0 w-full" />
            
            {/* Desktop Grid (4 columns) */}
            <div className="hidden md:grid gap-5 grid-cols-[repeat(4,_minmax(0px,_1fr))] grid-rows-[repeat(1,_fit-content(100%))] relative shrink-0 w-full">
              {/* Column 1: Logo */}
              <div className="[grid-area:1_/_1] content-stretch flex flex-col items-start relative shrink-0">
                <div className="content-stretch flex gap-3 items-center justify-center relative shrink-0">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src={imgFinalSealLogo1}
                    />
                  </div>
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </div>
              </div>
              
              {/* Column 3: Nav Links */}
              <div className="[grid-area:1_/_3] content-stretch flex flex-col gap-2 items-start relative shrink-0">
                <LinksBackgroundImageAndText text="Work" href="/" />
                <LinksBackgroundImageAndText text="Art" href="/art" />
                <LinksBackgroundImageAndText text="About" href="/about" />
              </div>
              
              {/* Column 4: Contact + Social */}
              <div className="[grid-area:1_/_4] content-stretch flex flex-col gap-4 items-start relative shrink-0">
                <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start relative shrink-0 text-gray-400 w-full">
                  <p className="leading-6 min-w-full relative shrink-0 text-base w-[min-content]">Let's work together!</p>
                  <p className="leading-6 relative shrink-0 text-base break-all">
                    <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                      <span>{`michelletheresaliu@gmail.com `}</span>
                      <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                    </a>
                  </p>
                </div>
                <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0">
                  <div className="content-stretch flex gap-6 items-start relative shrink-0">
                    <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="social-link">
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
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Layout (Vertical Stack) */}
            <div className="md:hidden content-stretch flex flex-col gap-10 items-start relative shrink-0 w-full">
              {/* Logo Section */}
              <div className="content-stretch flex flex-col gap-1.5 items-start relative shrink-0">
                <div className="content-stretch flex gap-2 items-center justify-center relative shrink-0">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src={imgFinalSealLogo1}
                    />
                  </div>
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal relative shrink-0 text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </div>
              </div>
              
              {/* Contact + Social + Nav */}
              <div className="content-stretch flex flex-col gap-10 items-start relative shrink-0">
                <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0">
                  <div className="content-stretch flex flex-col font-['Figtree',sans-serif] font-normal items-start relative shrink-0 text-gray-400 w-[326px]">
                    <p className="leading-6 relative shrink-0 text-base w-full">Let's work together!</p>
                    <p className="leading-6 relative shrink-0 text-base w-full break-all">
                      <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                        <span>{`michelletheresaliu@gmail.com `}</span>
                        <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                      </a>
                    </p>
                  </div>
                  <div className="content-stretch flex flex-col gap-4 items-start relative shrink-0 w-[326px]">
                    <div className="content-stretch flex gap-11 items-start relative shrink-0">
                      <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="social-link">
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
            <p className="font-['Figtree',sans-serif] font-normal leading-7 relative shrink-0 text-gray-500 text-sm">
              <span>{`Built with React & `}</span>
              <span className="group">
                <a
                  className="[text-underline-position:from-font] cursor-pointer decoration-solid underline group-hover:!text-emerald-600 transition-colors"
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
            <TextScramble 
              text="CHANGELOG: 12-26-25"
              className="font-['Figtree',sans-serif] font-normal leading-5 tracking-wider relative shrink-0 text-[#9ca3af] text-xs text-nowrap"
            />
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

