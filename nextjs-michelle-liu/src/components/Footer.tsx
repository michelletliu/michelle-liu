"use client";

import React, { useRef, useEffect } from "react";

// Text Scramble Component
function TextScramble({ text, className }: { text: string; className?: string }) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const isAnimatingRef = useRef(false);
  const textRef = useRef(text);
  const isVisibleRef = useRef(false);
  
  const chars = '!@#$%^&*()_+-;:,.<>?ADELPSTUadelpstu0123456789';

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const generateScrambledText = (originalText: string) => {
    let scrambled = '';
    for (let i = 0; i < originalText.length; i++) {
      if (originalText[i] === ' ' || originalText[i] === ':' || originalText[i] === '-') {
        scrambled += originalText[i];
      } else {
        scrambled += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    return scrambled;
  };

  const runScrambleAnimation = () => {
    const el = elementRef.current;
    const targetText = textRef.current;
    if (!el || isAnimatingRef.current) return;
    
    isAnimatingRef.current = true;
    const oldText = el.innerText;
    const length = Math.max(oldText.length, targetText.length);
    
    const queue: Array<{ from: string; to: string; start: number; end: number; char?: string }> = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = targetText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      queue.push({ from, to, start, end });
    }
    
    let frame = 0;
    
    const update = () => {
      let output = '';
      let complete = 0;
      
      for (let i = 0; i < queue.length; i++) {
        const { from, to, start, end } = queue[i];
        
        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!queue[i].char || Math.random() < 0.28) {
            queue[i].char = chars[Math.floor(Math.random() * chars.length)];
          }
          output += `<span style="color: #c4c4c4">${queue[i].char}</span>`;
        } else {
          output += from;
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

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.innerText = generateScrambledText(text);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisibleRef.current) {
            isVisibleRef.current = true;
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

  return <p ref={elementRef} className={className}>{text}</p>;
}

// Social Icons
const InstagramIcon = () => (
  <svg className="size-5" viewBox="0 0 20 20" fill="none">
    <path d="M10 1.80078C12.6719 1.80078 12.9883 1.8125 14.0391 1.85937C15.0156 1.90234 15.543 2.06641 15.8945 2.20313C16.3594 2.38281 16.6953 2.60156 17.043 2.94922C17.3945 3.30078 17.6094 3.63281 17.7891 4.09766C17.9258 4.44922 18.0898 4.98047 18.1328 5.95312C18.1797 7.00781 18.1914 7.32422 18.1914 9.99219C18.1914 12.6641 18.1797 12.9805 18.1328 14.0313C18.0898 15.0078 17.9258 15.5352 17.7891 15.8867C17.6094 16.3516 17.3906 16.6875 17.043 17.0352C16.6914 17.3867 16.3594 17.6016 15.8945 17.7813C15.543 17.918 15.0117 18.082 14.0391 18.125C12.9844 18.1719 12.668 18.1836 10 18.1836C7.32813 18.1836 7.01172 18.1719 5.96094 18.125C4.98438 18.082 4.45703 17.918 4.10547 17.7813C3.64063 17.6016 3.30469 17.3828 2.95703 17.0352C2.60547 16.6836 2.39063 16.3516 2.21094 15.8867C2.07422 15.5352 1.91016 15.0039 1.86719 14.0313C1.82031 12.9766 1.80859 12.6602 1.80859 9.99219C1.80859 7.32031 1.82031 7.00391 1.86719 5.95312C1.91016 4.97656 2.07422 4.44922 2.21094 4.09766C2.39063 3.63281 2.60938 3.29688 2.95703 2.94922C3.30859 2.59766 3.64063 2.38281 4.10547 2.20313C4.45703 2.06641 4.98828 1.90234 5.96094 1.85937C7.01172 1.8125 7.32813 1.80078 10 1.80078ZM10 0C7.28516 0 6.94531 0.0117188 5.87891 0.0585938C4.81641 0.105469 4.08594 0.277344 3.45313 0.523438C2.79297 0.78125 2.23438 1.12109 1.67969 1.67969C1.12109 2.23438 0.78125 2.79297 0.523438 3.44922C0.277344 4.08594 0.105469 4.8125 0.0585938 5.875C0.0117188 6.94531 0 7.28516 0 10C0 12.7148 0.0117188 13.0547 0.0585938 14.1211C0.105469 15.1836 0.277344 15.9141 0.523438 16.5469C0.78125 17.207 1.12109 17.7656 1.67969 18.3203C2.23438 18.875 2.79297 19.2188 3.44922 19.4727C4.08594 19.7188 4.8125 19.8906 5.875 19.9375C6.94141 19.9844 7.28125 19.9961 9.99609 19.9961C12.7109 19.9961 13.0508 19.9844 14.1172 19.9375C15.1797 19.8906 15.9102 19.7188 16.543 19.4727C17.1992 19.2188 17.7578 18.875 18.3125 18.3203C18.8672 17.7656 19.2109 17.207 19.4648 16.5508C19.7109 15.9141 19.8828 15.1875 19.9297 14.125C19.9766 13.0586 19.9883 12.7188 19.9883 10.0039C19.9883 7.28906 19.9766 6.94922 19.9297 5.88281C19.8828 4.82031 19.7109 4.08984 19.4648 3.45703C19.2188 2.79297 18.8789 2.23438 18.3203 1.67969C17.7656 1.125 17.207 0.78125 16.5508 0.527344C15.9141 0.28125 15.1875 0.109375 14.125 0.0625C13.0547 0.0117188 12.7148 0 10 0Z" fill="#C4C9D0"/>
    <path d="M10 4.86328C7.16406 4.86328 4.86328 7.16406 4.86328 10C4.86328 12.8359 7.16406 15.1367 10 15.1367C12.8359 15.1367 15.1367 12.8359 15.1367 10C15.1367 7.16406 12.8359 4.86328 10 4.86328ZM10 13.332C8.16016 13.332 6.66797 11.8398 6.66797 10C6.66797 8.16016 8.16016 6.66797 10 6.66797C11.8398 6.66797 13.332 8.16016 13.332 10C13.332 11.8398 11.8398 13.332 10 13.332Z" fill="#C4C9D0"/>
    <path d="M16.5391 4.66016C16.5391 5.32422 16 5.85938 15.3398 5.85938C14.6758 5.85938 14.1406 5.32031 14.1406 4.66016C14.1406 3.99609 14.6797 3.46094 15.3398 3.46094C16 3.46094 16.5391 4 16.5391 4.66016Z" fill="#C4C9D0"/>
  </svg>
);

const XIcon = () => (
  <svg className="size-5" viewBox="0 0 19 18" fill="none">
    <path d="M14.7031 0.84375H17.418L11.4023 7.75781L18.4883 17.1562H12.9492L8.60547 11.5039L3.63672 17.1562H0.917969L7.35547 9.76172L0.542969 0.84375H6.23047L10.1562 5.99609L14.7031 0.84375ZM13.7305 15.5039H15.2695L5.36719 2.42188H3.71484L13.7305 15.5039Z" fill="#C4C9D0"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="size-[18px]" viewBox="0 0 18 18" fill="none">
    <path d="M16.5 0.5H1.5C0.945312 0.5 0.5 0.945312 0.5 1.5V16.5C0.5 17.0547 0.945312 17.5 1.5 17.5H16.5C17.0547 17.5 17.5 17.0547 17.5 16.5V1.5C17.5 0.945312 17.0547 0.5 16.5 0.5ZM5.57031 15.0625H3.0625V7.00781H5.57031V15.0625ZM4.31641 5.89844C3.50781 5.89844 2.85547 5.24219 2.85547 4.4375C2.85547 3.63281 3.50781 2.97656 4.31641 2.97656C5.12109 2.97656 5.77734 3.63281 5.77734 4.4375C5.77734 5.23828 5.12109 5.89844 4.31641 5.89844ZM15.0625 15.0625H12.5586V11.1562C12.5586 10.2188 12.5391 9.01562 11.2578 9.01562C9.95703 9.01562 9.76172 10.0352 9.76172 11.0898V15.0625H7.26172V7.00781H9.66406V8.11328H9.69922C10.0352 7.48047 10.8516 6.80469 12.0508 6.80469C14.5898 6.80469 15.0625 8.46875 15.0625 10.6406V15.0625Z" fill="#C4C9D0" stroke="#C4C9D0" strokeWidth="0.5"/>
  </svg>
);

function LinksText({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center px-0.5 py-0 rounded-full">
      <p className="font-['Figtree',sans-serif] leading-5 text-[#9ca3af] text-base text-nowrap tracking-[0.16px] hover:text-[#6b7280] transition-colors cursor-pointer">
        {text}
      </p>
    </div>
  );
}

export default function Footer() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center size-full">
        <div className="flex flex-col gap-16 items-center px-16 max-md:px-8 pt-8 pb-8 max-md:pb-16 max-md:pt-4 relative w-full">
          <div className="flex flex-col gap-5 items-start relative shrink-0 w-full">
            <div className="bg-[#e5e7eb] h-px shrink-0 w-full" />
            
            {/* Desktop Grid (4 columns) */}
            <div className="hidden md:grid gap-5 grid-cols-[repeat(4,_minmax(0px,_1fr))] relative shrink-0 w-full">
              {/* Column 1: Logo */}
              <div className="[grid-area:1_/_1] flex flex-col items-start relative shrink-0">
                <div className="flex gap-3 items-center justify-center relative shrink-0">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src="/logo.png"
                    />
                  </div>
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </div>
              </div>
              
              {/* Column 3: Nav Links */}
              <div className="[grid-area:1_/_3] flex flex-col gap-2 items-start relative shrink-0">
                <LinksText text="Work" />
                <LinksText text="Art" />
                <LinksText text="About" />
              </div>
              
              {/* Column 4: Contact + Social */}
              <div className="[grid-area:1_/_4] flex flex-col gap-4 items-start relative shrink-0">
                <div className="flex flex-col font-['Figtree',sans-serif] font-normal items-start text-gray-400 w-full">
                  <p className="leading-6 min-w-full text-base">Let&apos;s work together!</p>
                  <p className="leading-6 text-base break-all">
                    <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                      <span>michelletheresaliu@gmail.com </span>
                      <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                    </a>
                  </p>
                </div>
                <div className="flex flex-col gap-4 items-start">
                  <div className="flex gap-6 items-start">
                    <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                      <InstagramIcon />
                    </a>
                    <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                      <XIcon />
                    </a>
                    <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                      <LinkedInIcon />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Layout (Vertical Stack) */}
            <div className="md:hidden flex flex-col gap-10 items-start w-full">
              {/* Logo Section */}
              <div className="flex flex-col gap-1.5 items-start">
                <div className="flex gap-2 items-center justify-center">
                  <div className="relative shrink-0 size-7">
                    <img
                      alt="Michelle Liu Logo"
                      className="object-contain size-full"
                      src="/logo.png"
                    />
                  </div>
                  <p className="font-['Figtree',sans-serif] font-medium leading-normal text-[#374151] text-[32px] w-[212px]">
                    michelle liu
                  </p>
                </div>
              </div>
              
              {/* Contact + Social + Nav */}
              <div className="flex flex-col gap-10 items-start">
                <div className="flex flex-col gap-4 items-start">
                  <div className="flex flex-col font-['Figtree',sans-serif] font-normal items-start text-gray-400 w-[326px]">
                    <p className="leading-6 text-base w-full">Let&apos;s work together!</p>
                    <p className="leading-6 text-base w-full break-all">
                      <a href="mailto:michelletheresaliu@gmail.com" className="hover:text-blue-500 text-gray-500 transition-colors duration-200">
                        <span>michelletheresaliu@gmail.com </span>
                        <span className="font-['Figtree',sans-serif] font-bold">↗</span>
                      </a>
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 items-start w-[326px]">
                    <div className="flex gap-11 items-start">
                      <a href="https://www.instagram.com/https.croissant/?hl=en" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                        <InstagramIcon />
                      </a>
                      <a href="https://x.com/michelletliu" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                        <XIcon />
                      </a>
                      <a href="https://www.linkedin.com/in/michelletliu" target="_blank" rel="noopener noreferrer" className="hover:opacity-70 transition-opacity">
                        <LinkedInIcon />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 items-start w-[338px]">
                  <LinksText text="WORK" />
                  <LinksText text="ART" />
                  <LinksText text="ABOUT" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 items-center">
            <p className="font-['Figtree',sans-serif] font-normal leading-7 text-gray-500 text-sm">
              <span>Built with Next.js &amp; </span>
              <a
                className="cursor-pointer underline hover:text-emerald-600 transition-colors"
                href="https://www.rockysmatcha.com/blogs/matcha-guide/how-to-make-matcha-guide"
                target="_blank"
                rel="noopener noreferrer"
              >
                rocky&apos;s matcha
              </a>
              <span> lattes.</span>
              <span className="text-gray-400"> ☕︎</span>
            </p>
            <TextScramble 
              text="CHANGELOG: 12-26-25"
              className="font-['Figtree',sans-serif] font-normal leading-5 tracking-wider text-[#9ca3af] text-xs text-nowrap"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

