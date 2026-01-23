import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate, PanInfo, AnimatePresence, MotionValue } from 'framer-motion';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import InfoButton from '../InfoButton';
import imgLogo from '../../assets/logo.png';
import { client, urlFor } from '../../sanity/client';
import { FLATLAY_SKETCHBOOKS_QUERY } from '../../sanity/queries';
import { useScrollLock } from '../../utils/useScrollLock';

// Default project info for InfoButton
const DEFAULT_SKETCHBOOK_PROJECT = {
  id: 'sketchbook',
  title: 'Digital Sketchbook',
  year: '2025',
  description: 'A digital home for sketches and visual journaling.',
  imageSrc: 'https://image.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg/thumbnail.png',
  videoSrc: 'https://stream.mux.com/iEo013MYI028Zit3nPTJetFvqbgweCC8e2NHbY702qsQBg.m3u8',
  tryItOutHref: '/sketchbook',
  toolCategories: [
    { label: 'Design', tools: ['Figma', 'Origami Studio'] },
    { label: 'Frontend', tools: ['TypeScript', 'React', 'Vite'] },
    { label: 'AI', tools: ['Windsurf','Claude Opus 4.5'] },
    { label: 'Animation', tools: ['Framer Motion'] },
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

// Page indicator - vertical lines with bouncy animation
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
        />
      ))}
    </div>
  );
}

// Individual page indicator bar that responds to drag
function PageIndicatorBar({
  index,
  current,
  total,
  onSelect,
  dragX,
  slideDistance,
}: {
  index: number;
  current: number;
  total: number;
  onSelect: (index: number) => void;
  dragX: MotionValue<number>;
  slideDistance: number;
}) {
  // Calculate progress: how much we're transitioning toward this index
  // When dragging left (negative x), we're moving toward higher indices
  // When dragging right (positive x), we're moving toward lower indices
  const progress = useTransform(dragX, (x) => {
    const normalizedX = x / slideDistance; // -1 to 1 range
    
    if (index === current) {
      // Current bar: shrink as we drag away
      return 1 - Math.min(Math.abs(normalizedX), 1);
    } else if (index === current + 1 && normalizedX < 0) {
      // Next bar: grow as we drag left
      return Math.min(-normalizedX, 1);
    } else if (index === current - 1 && normalizedX > 0) {
      // Previous bar: grow as we drag right
      return Math.min(normalizedX, 1);
    }
    return 0;
  });
  
  const height = useTransform(progress, [0, 1], [24, 32]);
  const backgroundColor = useTransform(progress, [0, 1], ['#d1d5db', '#1f2937']);
  
  return (
    <motion.button
      onClick={() => onSelect(index)}
      className="w-[2.5px] rounded-full"
      style={{
        height,
        backgroundColor,
      }}
      aria-label={`Go to page ${index + 1}`}
    />
  );
}

// Main page component
export default function SketchbookPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<FlatlaySketchbook[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Lock scroll when image is expanded
  useScrollLock(!!expandedImage);
  
  // Handle closing the expanded image with animation
  const closeExpandedImage = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setExpandedImage(null);
      setIsClosing(false);
    }, 200);
  }, []);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const [cardWidth, setCardWidth] = useState(320);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const dragStartedRef = useRef(false); // Track if drag gesture started (to prevent click)
  const isAnimatingRef = useRef(false); // Prevent multiple rapid navigations
  
  // Transform positions based on drag - images travel full width
  const pageWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
  // On mobile, increase spacing so adjacent images are fully off-screen
  const slideDistance = pageWidth < 640 ? pageWidth * 0.8 : pageWidth * 0.5;
  
  // Current image: starts at center (0), moves with drag
  // When x = -slideDistance, current should be at -slideDistance (off left)
  // When x = slideDistance, current should be at slideDistance (off right)
  const currentImageX = useTransform(x, (value) => value);
  
  // Next image (right): starts at slideDistance, ends at 0 when x = -slideDistance
  const nextImageX = useTransform(x, (value) => slideDistance + value);
  
  // Previous image (left): starts at -slideDistance, ends at 0 when x = slideDistance
  const prevImageX = useTransform(x, (value) => -slideDistance + value);
  
  // Date opacities - crossfade between current, next, and previous dates
  const currentDateOpacity = useTransform(x, [-slideDistance/2, 0, slideDistance/2], [0, 1, 0]);
  const nextDateOpacity = useTransform(x, [-slideDistance/2, 0], [1, 0]);
  const prevDateOpacity = useTransform(x, [0, slideDistance/2], [0, 1]);
  
  // "More sketches coming soon!" opacity - fades out when swiping in either direction
  const comingSoonOpacity = useTransform(x, [-slideDistance/3, 0, slideDistance/3], [0, 1, 0]);
  
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
      // Single card centered - smaller on mobile to hide adjacent images
      if (vw < 640) {
        setCardWidth(vw * 0.5); // Smaller on mobile
      } else {
        setCardWidth(Math.min(320, vw * 0.25));
      }
    }
    
    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    return () => window.removeEventListener('resize', updateCardWidth);
  }, []);
  
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
      if (e.key === 'Escape' && expandedImage) {
        closeExpandedImage();
      } else if (e.key === 'ArrowLeft' && !expandedImage) {
        // Navigate to previous page with animation
        if (currentIndex > 0) {
          setSwipeDirection('right');
          animateToPrevPage();
        }
      } else if (e.key === 'ArrowRight' && !expandedImage) {
        // Navigate to next page with animation
        if (currentIndex < entries.length - 1) {
          setSwipeDirection('left');
          animateToNextPage();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage, currentIndex, entries.length, animateToNextPage, animateToPrevPage, closeExpandedImage]);
  
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
  
  return (
    <div className="min-h-screen bg-white flex flex-col max-sm:overflow-hidden max-sm:h-screen max-sm:fixed max-sm:inset-0 max-sm:overscroll-none max-sm:touch-none">
      {/* Logo - fixed position matching /polaroid */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 md:left-16 z-40 cursor-pointer transition-opacity duration-200 hover:opacity-80"
        aria-label="Go back to home"
      >
        <img 
          src={imgLogo} 
          alt="Michelle Liu Logo" 
          className="w-[44px] h-[44px] object-contain"
        />
      </button>

      {/* Info Button - fixed top right */}
      <InfoButton project={DEFAULT_SKETCHBOOK_PROJECT} />
      
      {/* Title and date */}
      <div className="text-center px-6 pt-16 pb-12 max-sm:pt-24 max-sm:pb-8 [@media(min-height:800px)]:pt-32 [@media(min-height:800px)]:pb-24 overflow-hidden relative">
        {/* Location title - crossfades between entries */}
        <div className="relative h-6">
          {/* Previous location */}
          {currentIndex > 0 && entries[currentIndex - 1] && (
            <motion.h1
              className="text-lg font-medium text-gray-900 absolute inset-x-0"
              style={{ opacity: prevDateOpacity }}
            >
              {entries[currentIndex - 1].location || 'sketchbook'}
            </motion.h1>
          )}
          {/* Current location */}
          <motion.h1
            className="text-lg font-medium text-gray-900 absolute inset-x-0"
            style={{ opacity: currentDateOpacity }}
          >
            {currentEntry?.location || 'sketchbook'}
          </motion.h1>
          {/* Next location */}
          {currentIndex < entries.length - 1 && entries[currentIndex + 1] && (
            <motion.h1
              className="text-lg font-medium text-gray-900 absolute inset-x-0"
              style={{ opacity: nextDateOpacity }}
            >
              {entries[currentIndex + 1].location || 'sketchbook'}
            </motion.h1>
          )}
        </div>
        <div className="relative h-6">
          {/* Previous date - fades in when swiping right */}
          {currentIndex > 0 && entries[currentIndex - 1] && (
            <motion.p
              className="text-gray-400 text-lg absolute inset-x-0"
              style={{ opacity: prevDateOpacity }}
            >
              {formatDate(entries[currentIndex - 1].date)}
            </motion.p>
          )}
          {/* Current date */}
          <motion.p
            className="text-gray-400 text-lg absolute inset-x-0"
            style={{ opacity: currentDateOpacity }}
          >
            {currentEntry && formatDate(currentEntry.date)}
          </motion.p>
          {/* Next date - fades in when swiping left */}
          {currentIndex < entries.length - 1 && entries[currentIndex + 1] && (
            <motion.p
              className="text-gray-400 text-lg absolute inset-x-0"
              style={{ opacity: nextDateOpacity }}
            >
              {formatDate(entries[currentIndex + 1].date)}
            </motion.p>
          )}
        </div>
        {/* "More sketches coming soon!" on last sketch - positioned below date */}
        <div className="h-6 mt-1">
          {currentIndex === entries.length - 1 && entries.length > 0 && (
            <motion.p 
              className="text-gray-400 text-base pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ opacity: comingSoonOpacity }}
            >
              more sketches coming soon! :)
            </motion.p>
          )}
        </div>
      </div>
      
      {/* Main carousel area - shows current, prev, and next images */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative">
        {/* Left gradient overlay - white fading to transparent */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-[15%] sm:w-[25%] z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, white 0%, white 50%, transparent 100%)' }}
        />
        {/* Right gradient overlay - white fading to transparent */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-[15%] sm:w-[25%] z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, white 0%, white 50%, transparent 100%)' }}
        />
        
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
              dragElastic={0.8}
              dragMomentum={true}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              onDragStart={() => {
                dragStartedRef.current = true;
              }}
              onDragEnd={handleDragEnd}
            >
              {/* Previous image (left) */}
              {currentIndex > 0 && entries[currentIndex - 1] && (
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ 
                    width: cardWidth,
                    x: prevImageX,
                  }}
                >
                  <img 
                    src={getImageUrl(entries[currentIndex - 1])} 
                    alt={entries[currentIndex - 1].note || `Sketch`}
                    className="w-full h-auto drop-shadow-sm"
                    draggable={false}
                  />
                </motion.div>
              )}
              
              {/* Current image (center) */}
              <motion.div 
                className="flex items-center justify-center"
                style={{ 
                  x: currentImageX,
                }}
                onClick={() => {
                  // Only open popup if drag gesture didn't start
                  if (!dragStartedRef.current && currentEntry && getImageUrl(currentEntry)) {
                    setExpandedImage(getImageUrl(currentEntry)!);
                  }
                  // Reset the ref after click is processed
                  dragStartedRef.current = false;
                }}
              >
                {currentEntry && getImageUrl(currentEntry) ? (
                  <img 
                    src={getImageUrl(currentEntry)} 
                    alt={currentEntry.note || `Sketch from ${formatDate(currentEntry.date)}`}
                    className="w-full h-auto drop-shadow-sm"
                    draggable={false}
                  />
                ) : (
                  <PlaceholderImage index={currentIndex} />
                )}
              </motion.div>
              
              {/* Next image (right) */}
              {currentIndex < entries.length - 1 && entries[currentIndex + 1] && (
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center"
                  style={{ 
                    width: cardWidth,
                    x: nextImageX,
                  }}
                >
                  <img 
                    src={getImageUrl(entries[currentIndex + 1])} 
                    alt={entries[currentIndex + 1].note || `Sketch`}
                    className="w-full h-auto drop-shadow-sm"
                    draggable={false}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
      
      {/* Page indicator */}
      {!loading && entries.length > 0 && (
        <div className="py-12">
          <PageIndicator 
            total={entries.length} 
            current={currentIndex}
            onSelect={setCurrentIndex}
            dragX={x}
            slideDistance={slideDistance}
          />
        </div>
      )}

      {/* Expanded Image Modal */}
      {expandedImage &&
        createPortal(
          <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : 'opacity-100 animate-[fadeIn_200ms_ease-out]'}`}
            onClick={closeExpandedImage}
          >
            {/* Light grey translucent overlay */}
            <div className="absolute inset-0 bg-gray-100/95" />

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeExpandedImage();
              }}
              className={`fixed right-4 top-4 z-[10000] flex h-10 w-10 items-center justify-center transition-all duration-200 hover:scale-110 ${isClosing ? '' : 'animate-[fadeSlideDown_300ms_ease-out]'}`}
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

            {/* Expanded image with date and note */}
            <div
              className={`relative z-10 flex flex-col max-h-[85vh] max-w-[90vw] items-center transition-all duration-200 ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100 animate-[scaleIn_300ms_ease-out]'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage}
                alt="Expanded sketch"
                className="max-h-[75vh] max-w-[90vw] object-contain drop-shadow-lg"
              />
              {currentEntry && (
                <div className="mt-4 text-center">
                  <p className="text-base text-gray-500">{formatDate(currentEntry.date)}</p>
                  {currentEntry.note && (
                    <p className="text-base text-gray-400">{currentEntry.note}</p>
                  )}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
