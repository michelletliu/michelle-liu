import { useRef, useEffect } from "react";

type TextScrambleProps = {
  text: string;
  className?: string;
  /** Trigger scramble animation on scroll into view (default: true) */
  animateOnScroll?: boolean;
  /** Trigger scramble animation on hover (default: true) */
  animateOnHover?: boolean;
  /** Delay before initial scroll animation (ms) */
  scrollDelay?: number;
};

const CHARS = "!@#$%^&*()_+-;:,.<>?ADELPSTUadelpstu0123456789";

/**
 * Text scramble animation effect — reveals text character by character with random glyphs.
 * Used in the Footer changelog link and HomePageClient section headers.
 */
export default function TextScramble({
  text,
  className,
  animateOnScroll = true,
  animateOnHover = true,
  scrollDelay = 100,
}: TextScrambleProps) {
  const elementRef = useRef<HTMLParagraphElement>(null);
  const isAnimatingRef = useRef(false);
  const textRef = useRef(text);
  const hasAnimatedOnScrollRef = useRef(false);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const runScrambleAnimation = () => {
    const el = elementRef.current;
    const targetText = textRef.current;
    if (!el || isAnimatingRef.current) return;

    isAnimatingRef.current = true;
    const length = targetText.length;

    const queue: Array<{
      to: string;
      start: number;
      end: number;
      char?: string;
    }>[] = [];
    const q: typeof queue[number] = [];
    for (let i = 0; i < length; i++) {
      const to = targetText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      q.push({ to, start, end });
    }

    let frame = 0;

    const update = () => {
      let output = "";
      let complete = 0;

      for (let i = 0; i < q.length; i++) {
        const { to, start, end } = q[i];

        if (frame >= end) {
          complete++;
          output += to;
        } else if (frame >= start) {
          if (!q[i].char || Math.random() < 0.28) {
            q[i].char = CHARS[Math.floor(Math.random() * CHARS.length)];
          }
          output += `<span class="text-zinc-300">${q[i].char}</span>`;
        } else {
          output += to;
        }
      }

      el.innerHTML = output;

      if (complete === q.length) {
        isAnimatingRef.current = false;
      } else {
        requestAnimationFrame(update);
        frame++;
      }
    };

    update();
  };

  const handleMouseEnter = () => {
    if (animateOnHover) {
      runScrambleAnimation();
    }
  };

  useEffect(() => {
    if (!animateOnScroll) return;

    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedOnScrollRef.current) {
            hasAnimatedOnScrollRef.current = true;
            setTimeout(() => {
              runScrambleAnimation();
            }, scrollDelay);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [animateOnScroll, scrollDelay]);

  return (
    <p
      ref={elementRef}
      className={`${className ?? ""} ${animateOnHover ? "cursor-pointer" : ""}`}
      onMouseEnter={handleMouseEnter}
    >
      {text}
    </p>
  );
}
