import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence, MotionValue } from 'framer-motion';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import InfoButton from '../InfoButton';
import imgLogo from '../../assets/logo.png';
import { useExperimentProject } from '../../hooks/useExperimentProject';
import { client, urlFor } from '../../sanity/client';
import { FLATLAY_SKETCHBOOKS_QUERY } from '../../sanity/queries';


// Default project info for InfoButton
const DEFAULT_SKETCHBOOK_PROJECT = {
  id: 'sketchbook',
  title: 'Digital Sketchbook',
  year: '2025',
  description: 'A digital home for sketches and visual journaling.',
  imageSrc: 'https://image.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg/thumbnail.png',
  videoSrc: 'https://stream.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg.m3u8',
  tryItOutHref: '/sketchbook',
  backgroundColor: '#ffffff',
  toolCategories: [
    { label: 'Design', tools: ['Figma'] },
    { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
    { label: 'Styling', tools: ['Tailwind CSS'] },
    { label: 'AI', tools: ['Figma Make', 'Cursor'] },
  ],
};

// Sanity types for flatlay sketchbook
type FlatlaySketchbook = {
  _id: string;
  image: {
    asset: {
      _ref: string;
    };
  };
  date: string;
  location?: string;
  note?: string;
};

// Placeholder data for development
const PLACEHOLDER_ENTRIES: FlatlaySketchbook[] = [
  { _id: 'p1', image: { asset: { _ref: '' } }, date: '2025-03-04', note: 'Royce Hall sketch' },
  { _id: 'p2', image: { asset: { _ref: '' } }, date: '2025-03-10', note: 'Coffee shop' },
  { _id: 'p3', image: { asset: { _ref: '' } }, date: '2025-03-15', note: 'Airport waiting' },
  { _id: 'p4', image: { asset: { _ref: '' } }, date: '2025-03-20', note: 'Park scene' },
  { _id: 'p5', image: { asset: { _ref: '' } }, date: '2025-03-25', note: 'Beach sunset' },
  { _id: 'p6', image: { asset: { _ref: '' } }, date: '2025-04-01', note: 'City skyline' },
  { _id: 'p7', image: { asset: { _ref: '' } }, date: '2025-04-05', note: 'Garden flowers' },
  { _id: 'p8', image: { asset: { _ref: '' } }, date: '2025-04-10', note: 'Mountain view' },
  { _id: 'p9', image: { asset: { _ref: '' } }, date: '2025-04-13', note: 'Street scene' },
];

// Format date like "Mar 04, 2025"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: '2-digit', 
    year: 'numeric' 
  });
}

// Placeholder image component
function PlaceholderImage({ index }: { index: number }) {
  const colors = [
    'bg-gradient-to-br from-amber-50 to-amber-100',
    'bg-gradient-to-br from-stone-50 to-stone-100',
    'bg-gradient-to-br from-slate-50 to-slate-100',
    'bg-gradient-to-br from-zinc-50 to-zinc-100',
    'bg-gradient-to-br from-neutral-50 to-neutral-100',
  ];
  
  return (
    <div className={clsx(
      'w-full h-full flex items-center justify-center rounded-lg',
      colors[index % colors.length]
    )}>
      <div className="text-center p-4">
        <div className="text-5xl mb-3 opacity-60">📓</div>
        <p className="text-gray-400 text-xs">Sketch {index + 1}</p>
      </div>
    </div>
  );
}

// Proximity effect constants
const PROXIMITY_DISTANCE_LIMIT = 3; // Number of bars affected by proximity

// Lerp function for smooth interpolation
function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

// Transform function for proximity effect
function transformProximity(
  distance: number,
  baseValue: number,
  maxValue: number,
  intensity: number
) {
  if (Math.abs(distance) > PROXIMITY_DISTANCE_LIMIT) {
    return baseValue;
  }
  const normalizedDistance = 1 - Math.abs(distance) / PROXIMITY_DISTANCE_LIMIT;
  const scaleFactor = normalizedDistance * normalizedDistance;
  return baseValue + intensity * scaleFactor;
}

// Page indicator - vertical lines with bouncy animation and proximity effect
function PageIndicator({ 
  total, 
  current, 
  onSelect,
  dragX,
  slideDistance,
}: { 
  total: number; 
  current: number;
  onSelect: (index: number) => void;
  dragX: MotionValue<number>;
  slideDistance: number;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  return (
    <div className="flex items-end justify-center gap-3 h-8">
      {Array.from({ length: total }).map((_, i) => (
        <PageIndicatorBar
          key={i}
          index={i}
          current={current}
          total={total}
          onSelect={onSelect}
          dragX={dragX}
          slideDistance={slideDistance}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
        />
      ))}
    </div>
  );
}

// Individual page indicator bar that responds to drag and proximity hover
function PageIndicatorBar({
  index,
  current,
  total,
  onSelect,
  dragX,
  slideDistance,
  hoveredIndex,
  setHoveredIndex,
}: {
  index: number;
  current: number;
  total: number;
  onSelect: (index: number) => void;
  dragX: MotionValue<number>;
  slideDistance: number;
  hoveredIndex: number | null;
  setHoveredIndex: (index: number | null) => void;
}) {
  // Animated values for smooth transitions
  const animatedHeight = useMotionValue(24);
  const animatedR = useMotionValue(209);
  const animatedG = useMotionValue(213);
  const animatedB = useMotionValue(219);
  
  // Calculate progress: how much we're transitioning toward this index
  const progress = useTransform(dragX, (x) => {
    const normalizedX = x / slideDistance;
    
    if (index === current) {
      return 1 - Math.min(Math.abs(normalizedX), 1);
    } else if (index === current + 1 && normalizedX < 0) {
      return Math.min(-normalizedX, 1);
    } else if (index === current - 1 && normalizedX > 0) {
      return Math.min(normalizedX, 1);
    }
    return 0;
  });
  
  // Proximity hover effect
  const isSelected = index === current;
  const distanceFromHovered = hoveredIndex !== null ? index - hoveredIndex : null;
  
  // Calculate target values based on state
  useEffect(() => {
    let animationFrame: number;
    const lerpFactor = 0.15; // Smoothing factor (0-1, lower = smoother)
    
    const animate = () => {
      let targetHeight: number;
      let targetR: number, targetG: number, targetB: number;
      
      const currentProgress = progress.get();
      
      if (currentProgress > 0) {
        // Drag-based animation (selected or transitioning)
        targetHeight = 24 + currentProgress * 8; // 24 to 32
        const colorProgress = currentProgress;
        targetR = 209 + (31 - 209) * colorProgress;
        targetG = 213 + (41 - 213) * colorProgress;
        targetB = 219 + (55 - 219) * colorProgress;
      } else if (hoveredIndex !== null && !isSelected && distanceFromHovered !== null) {
        // Proximity hover effect
        targetHeight = transformProximity(distanceFromHovered, 24, 28, 4);
        const colorIntensity = transformProximity(distanceFromHovered, 0, 1, 1);
        targetR = 209 + (156 - 209) * colorIntensity;
        targetG = 213 + (163 - 213) * colorIntensity;
        targetB = 219 + (175 - 219) * colorIntensity;
      } else {
        // Default state
        targetHeight = 24;
        targetR = 209;
        targetG = 213;
        targetB = 219;
      }
      
      // Lerp to target values
      animatedHeight.set(lerp(animatedHeight.get(), targetHeight, lerpFactor));
      animatedR.set(lerp(animatedR.get(), targetR, lerpFactor));
      animatedG.set(lerp(animatedG.get(), targetG, lerpFactor));
      animatedB.set(lerp(animatedB.get(), targetB, lerpFactor));
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hoveredIndex, isSelected, distanceFromHovered, progress, animatedHeight, animatedR, animatedG, animatedB]);
  
  const backgroundColor = useTransform(
    [animatedR, animatedG, animatedB],
    ([r, g, b]) => `rgb(${Math.round(r as number)}, ${Math.round(g as number)}, ${Math.round(b as number)})`
  );
  
  return (
    <button
      onClick={() => onSelect(index)}
      className="flex items-end justify-center px-1.5 py-1 -mx-1.5 -my-1"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
      aria-label={`Go to page ${index + 1}`}
    >
      <motion.div
        className="w-[2.5px] rounded-full"
        style={{
          height: animatedHeight,
          backgroundColor,
        }}
      />
    </button>
  );
}

// Main page component
export default function SketchbookPage() {
  const navigate = useNavigate();
  
  // Fetch project info from Sanity (with fallback to defaults)
  const projectInfo = useExperimentProject('sketchbook', DEFAULT_SKETCHBOOK_PROJECT);
  const [entries, setEntries] = useState<FlatlaySketchbook[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  // Initialize isFullscreen based on URL path to avoid flash of wrong layout
  const [isFullscreen, setIsFullscreen] = useState(() => {
    return typeof window !== 'undefined' && window.location.pathname.includes('/full');
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const [cardWidth, setCardWidth] = useState(320);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const dragStartedRef = useRef(false); // Track if drag gesture started (to prevent click)
  const isAnimatingRef = useRef(false); // Prevent multiple rapid navigations
  
  // Transform positions based on drag - images travel full width
  const pageWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  // Spacing between images - smaller in fullscreen to keep adjacent visible, larger in popup
  const slideDistance = pageWidth < 640 ? cardWidth * 1.7 : (isFullscreen ? cardWidth * 2.1 : cardWidth * 1.7);
  
  // Use a ref so transform closures always get the latest slideDistance
  const slideDistanceRef = useRef(slideDistance);
  slideDistanceRef.current = slideDistance;
  
  // Current image: starts at center (0), moves with drag
  const currentImageX = useTransform(x, (value) => value);
  
  // Next image (right): starts at slideDistance, ends at 0 when x = -slideDistance
  const nextImageX = useTransform(x, (value) => slideDistanceRef.current + value);
  
  // Previous image (left): starts at -slideDistance, ends at 0 when x = slideDistance
  const prevImageX = useTransform(x, (value) => -slideDistanceRef.current + value);
  
  // Far next image (2 positions right): starts at 2*slideDistance
  const farNextImageX = useTransform(x, (value) => slideDistanceRef.current * 2 + value);
  
  // Far previous image (2 positions left): starts at -2*slideDistance
  const farPrevImageX = useTransform(x, (value) => -slideDistanceRef.current * 2 + value);
  
  // Date opacities - crossfade between current, next, and previous dates
  const currentDateOpacity = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    const half = sd / 2;
    if (xVal <= -half) return 0;
    if (xVal >= half) return 0;
    if (xVal < 0) return 1 + xVal / half;
    return 1 - xVal / half;
  });
  const nextDateOpacity = useTransform(x, (xVal) => {
    const half = slideDistanceRef.current / 2;
    if (xVal >= 0) return 0;
    return Math.min(1, -xVal / half);
  });
  const prevDateOpacity = useTransform(x, (xVal) => {
    const half = slideDistanceRef.current / 2;
    if (xVal <= 0) return 0;
    return Math.min(1, xVal / half);
  });
  
  // Image opacities - smooth transition between current and adjacent images
  // Side images always visible at 0.5 opacity, fade to 1 when becoming center
  const currentImageOpacity = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    const progress = Math.min(1, Math.abs(xVal) / sd);
    return 1 - progress * 0.5;
  });
  const nextImageOpacity = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    if (xVal >= 0) return 0.5;
    const progress = Math.min(1, -xVal / sd);
    return 0.5 + progress * 0.5;
  });
  const prevImageOpacity = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    if (xVal <= 0) return 0.5;
    const progress = Math.min(1, xVal / sd);
    return 0.5 + progress * 0.5;
  });
  
  // Image scales - smooth size transition (0.85 for side images, 1 for center)
  const currentImageScale = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    const progress = Math.min(1, Math.abs(xVal) / sd);
    return 1 - progress * 0.15;
  });
  const nextImageScale = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    if (xVal >= 0) return 0.85;
    const progress = Math.min(1, -xVal / sd);
    return 0.85 + progress * 0.15;
  });
  const prevImageScale = useTransform(x, (xVal) => {
    const sd = slideDistanceRef.current;
    if (xVal <= 0) return 0.85;
    const progress = Math.min(1, xVal / sd);
    return 0.85 + progress * 0.15;
  });
  
  // "More sketches coming soon!" opacity - fades out when swiping in either direction
  const comingSoonOpacity = useTransform(x, (xVal) => {
    const third = slideDistanceRef.current / 3;
    if (Math.abs(xVal) >= third) return 0;
    return 1 - Math.abs(xVal) / third;
  });
  
  // Force transforms to re-evaluate when slideDistance changes
  useEffect(() => {
    // Trigger a tiny x change to force transforms to re-evaluate with new slideDistance
    const currentX = x.get();
    x.set(currentX + 0.001);
    requestAnimationFrame(() => x.set(currentX));
  }, [slideDistance, x]);
  
  // Detect fullscreen mode
  useEffect(() => {
    const checkFullscreen = () => {
      if (pageContainerRef.current) {
        const isInPopup = pageContainerRef.current.closest('.experiment-modal-embed:not(.fullscreen)') !== null;
        setIsFullscreen(!isInPopup);
      } else {
        // If not in modal at all, treat as fullscreen
        setIsFullscreen(true);
      }
    };
    
    checkFullscreen();
    window.addEventListener('resize', checkFullscreen);
    
    const modalEmbed = pageContainerRef.current?.closest('.experiment-modal-embed');
    let observer: MutationObserver | null = null;
    if (modalEmbed) {
      observer = new MutationObserver(checkFullscreen);
      observer.observe(modalEmbed, { attributes: true, attributeFilter: ['class'] });
    }
    
    return () => {
      window.removeEventListener('resize', checkFullscreen);
      observer?.disconnect();
    };
  }, []);

  // Fetch entries from Sanity
  useEffect(() => {
    async function fetchEntries() {
      try {
        const data = await client.fetch<FlatlaySketchbook[]>(FLATLAY_SKETCHBOOKS_QUERY);
        if (data && data.length > 0) {
          setEntries(data);
        } else {
          setEntries(PLACEHOLDER_ENTRIES);
        }
      } catch (error) {
        console.error('Error fetching sketchbook entries:', error);
        setEntries(PLACEHOLDER_ENTRIES);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEntries();
  }, []);
  
  // Calculate card width based on viewport - single centered card
  useEffect(() => {
    function updateCardWidth() {
      const vw = window.innerWidth;
      // Single card centered - smaller in popup, larger in fullscreen
      // Use pageContainerRef (always attached) instead of containerRef (only attached after loading)
      const container = pageContainerRef.current?.closest('.experiment-modal-embed');
      const isInModal = !!container;
      
      if (vw < 640) {
        setCardWidth(vw * 0.8); // Mobile - 2x larger (was 0.4)
      } else if (isInModal) {
        setCardWidth(Math.min(320, vw * 0.25)); // Popup mode
      } else {
        setCardWidth(Math.min(800, vw * 0.55)); // Fullscreen - full size
      }
    }
    
    // Run immediately and on resize - pageContainerRef is always attached
    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    return () => {
      window.removeEventListener('resize', updateCardWidth);
    };
  }, [loading]); // Re-run when loading changes to ensure correct sizing after data loads
  
  // Animate to show transition then change index
  const animateToNextPage = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    const targetX = -slideDistance;
    animate(x, targetX, {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      onComplete: () => {
        // Instantly reset position and change index together
        x.jump(0);
        setCurrentIndex(prev => prev + 1);
        isAnimatingRef.current = false;
      }
    });
  }, [x, slideDistance]);
  
  const animateToPrevPage = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    const targetX = slideDistance;
    animate(x, targetX, {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      onComplete: () => {
        // Instantly reset position and change index together
        x.jump(0);
        setCurrentIndex(prev => prev - 1);
        isAnimatingRef.current = false;
      }
    });
  }, [x, slideDistance]);
  
  // Reset x position (snap back)
  const resetPosition = useCallback(() => {
    animate(x, 0, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [x]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // Navigate to previous page with animation
        if (currentIndex > 0) {
          setSwipeDirection('right');
          animateToPrevPage();
        }
      } else if (e.key === 'ArrowRight') {
        // Navigate to next page with animation
        if (currentIndex < entries.length - 1) {
          setSwipeDirection('left');
          animateToNextPage();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, entries.length, animateToNextPage, animateToPrevPage]);
  
  // Handle drag end - swipe to change page with animation
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 0; // Any movement triggers swipe
    const velocityThreshold = 0; // Any velocity triggers swipe
    const velocity = info.velocity.x;
    const offset = info.offset.x;
    
    if (offset < -threshold || velocity < -velocityThreshold) {
      // Swipe left - next page
      if (currentIndex < entries.length - 1) {
        setSwipeDirection('left');
        animateToNextPage();
        return;
      }
    } else if (offset > threshold || velocity > velocityThreshold) {
      // Swipe right - previous page
      if (currentIndex > 0) {
        setSwipeDirection('right');
        animateToPrevPage();
        return;
      }
    }
    
    // Always snap back to center
    resetPosition();
  };
  
  // Get image URL from Sanity - only constrain width, let height be natural
  const getImageUrl = (entry: FlatlaySketchbook) => {
    if (!entry.image?.asset?._ref) return undefined;
    return urlFor(entry.image).width(1000).fit('max').url();
  };
  
  const currentEntry = entries[currentIndex];
  
  // Preload adjacent images
  const prevImageUrl = entries[currentIndex - 1] ? getImageUrl(entries[currentIndex - 1]) : null;
  const nextImageUrl = entries[currentIndex + 1] ? getImageUrl(entries[currentIndex + 1]) : null;
  
  // Preload more images (2 ahead and 2 behind)
  const imagesToPreload = [
    entries[currentIndex - 2] ? getImageUrl(entries[currentIndex - 2]) : null,
    prevImageUrl,
    nextImageUrl,
    entries[currentIndex + 2] ? getImageUrl(entries[currentIndex + 2]) : null,
  ].filter(Boolean);
  
  return (
    <>
      {/* Hidden preload images - actual img elements for reliable preloading */}
      <div className="hidden">
        {imagesToPreload.map((url, i) => (
          <img key={i} src={url!} alt="" />
        ))}
      </div>
    <div 
      ref={pageContainerRef}
      className={`sketchbook-page-container flex flex-col relative ${isFullscreen ? 'h-screen overflow-hidden pt-8 pb-8 justify-center max-[650px]:gap-12' : 'h-screen overflow-hidden pb-16 justify-center max-[650px]:gap-12'}`}
      style={{ backgroundColor: projectInfo.backgroundColor || '#ffffff' }}
    >
      {/* Logo - fixed position matching /polaroid, animates in smoothly */}
      <motion.button
        onClick={() => {
          const isFullscreen = window.location.pathname.includes('/full');
          if (isFullscreen) {
            navigate('/project/sketchbook');
          } else {
            navigate('/');
          }
        }}
        className="fixed top-8 left-6 md:left-16 z-40 cursor-pointer hover:opacity-80"
        aria-label="Go back to home"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <img 
          src={imgLogo} 
          alt="Michelle Liu Logo" 
          className="w-[44px] h-[44px] object-contain"
        />
      </motion.button>

      {/* Info Button - fixed top right */}
      <InfoButton project={projectInfo} />
      
      {/* Title and date - opacity responds to drag position */}
      <div className={`text-center px-6 shrink-0 relative ${isFullscreen ? 'pb-16' : 'pb-8 max-[650px]:pb-16'}`}>
        {/* Current entry text */}
        <motion.div style={{ opacity: currentDateOpacity }}>
          <h1 className="text-lg font-medium text-gray-900 h-7">
            {currentEntry?.location || ''}
          </h1>
          <p className="text-gray-400 text-lg h-6">
            {currentEntry && formatDate(currentEntry.date)}
          </p>
        </motion.div>
        {/* Next entry text (shows when dragging left) */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-start"
          style={{ opacity: nextDateOpacity }}
        >
          <h1 className="text-lg font-medium text-gray-900 h-7">
            {entries[currentIndex + 1]?.location || ''}
          </h1>
          <p className="text-gray-400 text-lg h-6">
            {entries[currentIndex + 1] && formatDate(entries[currentIndex + 1].date)}
          </p>
        </motion.div>
        {/* Previous entry text (shows when dragging right) */}
        <motion.div 
          className="absolute inset-0 flex flex-col items-center justify-start"
          style={{ opacity: prevDateOpacity }}
        >
          <h1 className="text-lg font-medium text-gray-900 h-7">
            {entries[currentIndex - 1]?.location || ''}
          </h1>
          <p className="text-gray-400 text-lg h-6">
            {entries[currentIndex - 1] && formatDate(entries[currentIndex - 1].date)}
          </p>
        </motion.div>
      </div>
      
      {/* Left gradient overlay - fixed to viewport edge */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-[15vw] z-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${projectInfo.backgroundColor || '#ffffff'} 0%, ${projectInfo.backgroundColor || '#ffffff'} 10%, transparent 100%)` }}
      />
      {/* Right gradient overlay - fixed to viewport edge */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-[15vw] z-10 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${projectInfo.backgroundColor || '#ffffff'} 0%, ${projectInfo.backgroundColor || '#ffffff'} 10%, transparent 100%)` }}
      />
      
      {/* Main carousel area - shows current, prev, and next images */}
      <div className="flex flex-col items-center justify-center overflow-visible relative h-[30vh] xl:h-[45vh]">
        
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative w-full flex justify-center"
          >
            {/* Drag container */}
            <motion.div
              className="relative"
              style={{ 
                width: cardWidth,
                touchAction: 'pan-y',
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              dragMomentum={true}
              dragTransition={{ bounceStiffness: 200, bounceDamping: 15 }}
              onDragStart={() => {
                dragStartedRef.current = true;
              }}
              onDragEnd={handleDragEnd}
            >
              {/* Far previous image (2 left) - preloaded for smooth transitions */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ 
                  width: cardWidth,
                  x: farPrevImageX,
                  opacity: currentIndex > 1 ? 0.5 : 0,
                  scale: 0.85,
                }}
              >
                {entries[currentIndex - 2] && (
                  <img 
                    src={getImageUrl(entries[currentIndex - 2])} 
                    alt={entries[currentIndex - 2].note || `Sketch`}
                    className="w-full h-auto max-h-[45vh] sm:max-h-[30vh] xl:max-h-[45vh] object-contain drop-shadow-sm"
                    draggable={false}
                    loading="eager"
                  />
                )}
              </motion.div>
              
              {/* Previous image (left) - always rendered to prevent abrupt appearance */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ 
                  width: cardWidth,
                  x: prevImageX,
                  opacity: currentIndex > 0 ? prevImageOpacity : 0,
                  scale: prevImageScale,
                }}
              >
                {entries[currentIndex - 1] && (
                  <img 
                    src={getImageUrl(entries[currentIndex - 1])} 
                    alt={entries[currentIndex - 1].note || `Sketch`}
                    className="w-full h-auto max-h-[45vh] sm:max-h-[30vh] xl:max-h-[45vh] object-contain drop-shadow-sm"
                    draggable={false}
                    loading="eager"
                  />
                )}
              </motion.div>
              
              {/* Current image (center) */}
              <motion.div 
                className="flex items-center justify-center"
                style={{ 
                  x: currentImageX,
                  opacity: currentImageOpacity,
                  scale: currentImageScale,
                }}
              >
                {currentEntry && getImageUrl(currentEntry) ? (
                  <img 
                    src={getImageUrl(currentEntry)} 
                    alt={currentEntry.note || `Sketch from ${formatDate(currentEntry.date)}`}
                    className="w-full h-auto max-h-[45vh] sm:max-h-[30vh] xl:max-h-[45vh] object-contain drop-shadow-sm"
                    draggable={false}
                  />
                ) : (
                  <PlaceholderImage index={currentIndex} />
                )}
              </motion.div>
              
              {/* Next image (right) - always rendered to prevent abrupt appearance */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ 
                  width: cardWidth,
                  x: nextImageX,
                  opacity: currentIndex < entries.length - 1 ? nextImageOpacity : 0,
                  scale: nextImageScale,
                }}
              >
                {entries[currentIndex + 1] && (
                  <img 
                    src={getImageUrl(entries[currentIndex + 1])} 
                    alt={entries[currentIndex + 1].note || `Sketch`}
                    className="w-full h-auto max-h-[45vh] sm:max-h-[30vh] xl:max-h-[45vh] object-contain drop-shadow-sm"
                    draggable={false}
                    loading="eager"
                  />
                )}
              </motion.div>
              
              {/* Far next image (2 right) - preloaded for smooth transitions */}
              <motion.div 
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                style={{ 
                  width: cardWidth,
                  x: farNextImageX,
                  opacity: currentIndex < entries.length - 2 ? 0.5 : 0,
                  scale: 0.85,
                }}
              >
                {entries[currentIndex + 2] && (
                  <img 
                    src={getImageUrl(entries[currentIndex + 2])} 
                    alt={entries[currentIndex + 2].note || `Sketch`}
                    className="w-full h-auto max-h-[45vh] sm:max-h-[30vh] xl:max-h-[45vh] object-contain drop-shadow-sm"
                    draggable={false}
                    loading="eager"
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Page indicator - always render container to prevent layout shift */}
      <div className={`shrink-0 ${isFullscreen ? 'pt-24' : 'pt-12 max-[650px]:pt-24'}`}>
        {!loading && entries.length > 0 && (
          <PageIndicator 
            total={entries.length} 
            current={currentIndex}
            onSelect={setCurrentIndex}
            dragX={x}
            slideDistance={slideDistance}
          />
        )}
      </div>
    </div>
    </>
  );
}
