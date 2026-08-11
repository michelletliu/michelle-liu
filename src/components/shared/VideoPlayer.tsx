import { useEffect, useRef } from "react";
import Hls, { type Level } from "hls.js";
import mux from "mux-embed";

/** Retina is worth paying for; 3x displays are not worth tripling the bitrate. */
const MAX_PIXEL_RATIO = 2;
/** Treat a rendition as sharp enough if it is within 5% of the required pixels. */
const UPSCALE_TOLERANCE = 1.05;
/** Begin streaming this far outside the viewport so playback is ready on arrival. */
const PRELOAD_MARGIN = "800px";
/** How many times a stall may push us to a lower rendition before we stop. */
const MAX_STALL_DOWNGRADES = 2;

/**
 * Picks the smallest rendition that still covers the element's device pixels.
 *
 * Left to its own devices, hls.js picks a rendition from measured bandwidth
 * alone. Because these videos are short, muted loops, the whole file gets
 * buffered on first pass and replays from buffer forever — so whatever quality
 * the initial (heavily contended) page load happened to measure is the quality
 * the viewer is stuck with, often a 270p rendition in a 1288px-wide box.
 */
function pickLevelIndex(levels: Level[], video: HTMLVideoElement): number {
  const rect = video.getBoundingClientRect();
  const cssWidth = rect.width || video.clientWidth;
  const cssHeight = rect.height || video.clientHeight;
  if (!cssWidth || !cssHeight) return -1;

  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  const targetWidth = cssWidth * ratio;
  const targetHeight = cssHeight * ratio;

  // `contain` letterboxes the video, so only the tighter axis has to be covered.
  const objectFit = window.getComputedStyle(video).objectFit;
  const letterboxed = objectFit === "contain" || objectFit === "scale-down";

  const bySize = levels
    .map((level, index) => index)
    .sort(
      (a, b) =>
        levels[a].width * levels[a].height - levels[b].width * levels[b].height ||
        levels[a].bitrate - levels[b].bitrate,
    );

  for (const index of bySize) {
    const { width, height } = levels[index];
    if (!width || !height) continue;
    const upscale = letterboxed
      ? Math.min(targetWidth / width, targetHeight / height)
      : Math.max(targetWidth / width, targetHeight / height);
    if (upscale <= UPSCALE_TOLERANCE) return index;
  }
  return bySize[bySize.length - 1];
}

type VideoPlayerProps = {
  /** The HLS stream URL (.m3u8) or regular video URL */
  src: string;
  /** Optional poster image to show before video plays */
  poster?: string;
  /** Your Mux environment key from the Mux dashboard */
  muxEnvKey?: string;
  /** A name to identify this player in Mux Data */
  playerName?: string;
  /** Additional metadata for Mux tracking */
  muxMetadata?: {
    video_id?: string;
    video_title?: string;
    viewer_user_id?: string;
    [key: string]: string | undefined;
  };
  /** Additional CSS classes */
  className?: string;
  /** Whether to autoplay the video */
  autoPlay?: boolean;
  /** Whether to mute the video */
  muted?: boolean;
  /** Whether to loop the video */
  loop?: boolean;
  /** Whether to show video controls */
  controls?: boolean;
  /** Callback when video is fully loaded and ready to play */
  onLoaded?: (videoElement?: HTMLVideoElement) => void;
};

export default function VideoPlayer({
  src,
  poster,
  muxEnvKey,
  playerName = "Portfolio Video Player",
  muxMetadata = {},
  className = "",
  autoPlay = true,
  muted = true,
  loop = true,
  controls = false,
  onLoaded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerInitTime = useRef(Date.now());
  const hasCalledOnLoaded = useRef(false);
  
  // Store callbacks and config in refs to avoid re-running the effect when they change
  // This prevents video reload when parent component re-renders
  const onLoadedRef = useRef(onLoaded);
  const muxEnvKeyRef = useRef(muxEnvKey);
  const playerNameRef = useRef(playerName);
  const muxMetadataRef = useRef(muxMetadata);
  const autoPlayRef = useRef(autoPlay);
  const mutedRef = useRef(muted);
  
  // Update refs on each render to always have latest values
  onLoadedRef.current = onLoaded;
  muxEnvKeyRef.current = muxEnvKey;
  playerNameRef.current = playerName;
  muxMetadataRef.current = muxMetadata;
  autoPlayRef.current = autoPlay;
  mutedRef.current = muted;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // IMPORTANT: Set muted state immediately and programmatically for autoplay to work
    // Set it both as property and attribute for maximum compatibility
    if (mutedRef.current) {
      video.muted = true;
      video.setAttribute('muted', '');
      video.defaultMuted = true;
    }

    // Function to attempt playing the video
    const attemptPlay = () => {
      if (!video.paused) return;
      video.muted = true;
      video.play().catch(() => {});
    };

    // Handler for when video has enough data to play
    const handleReady = () => {
      if (onLoadedRef.current && !hasCalledOnLoaded.current) {
        hasCalledOnLoaded.current = true;
        onLoadedRef.current(video);
      }
      if (autoPlayRef.current) {
        attemptPlay();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoPlayRef.current) {
        attemptPlay();
      }
    };

    const handleUserInteraction = () => {
      if (autoPlayRef.current) {
        attemptPlay();
      }
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };

    // Listen for multiple readiness events — mobile Safari often skips canplaythrough
    video.addEventListener('loadeddata', handleReady);
    video.addEventListener('canplay', handleReady);
    video.addEventListener('canplaythrough', handleReady);
    
    // Listen for progress events to track buffering
    video.addEventListener('progress', handleReady);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('click', handleUserInteraction, { passive: true });

    // Periodic retry for mobile — some browsers need multiple attempts
    const retryInterval = setInterval(() => {
      if (!video.paused) {
        clearInterval(retryInterval);
        return;
      }
      if (autoPlayRef.current && video.readyState >= 2) {
        attemptPlay();
      }
    }, 1000);
    setTimeout(() => clearInterval(retryInterval), 10000);

    const isHlsSource = src.includes(".m3u8");

    // Function to initialize Mux monitoring
    const initMuxMonitoring = (hlsInstance?: Hls) => {
      if (!muxEnvKeyRef.current) {
        console.warn("Mux env_key not provided. Video monitoring is disabled.");
        return;
      }

      const muxOptions: Record<string, unknown> = {
        data: {
          env_key: muxEnvKeyRef.current,
          player_name: playerNameRef.current,
          player_init_time: playerInitTime.current,
          ...muxMetadataRef.current,
        },
      };

      // Add HLS.js reference if using HLS
      if (hlsInstance) {
        muxOptions.hlsjs = hlsInstance;
        muxOptions.Hls = Hls;
      }

      mux.monitor(video, muxOptions);
    };

    // Highest rendition we're willing to request, lowered when playback stalls.
    let levelCeiling = Number.POSITIVE_INFINITY;
    let pinnedLevel = -1;
    let stallDowngrades = 0;

    const pinLevel = (hls: Hls, isInitial: boolean) => {
      if (!hls.levels.length) return;
      const index = Math.min(pickLevelIndex(hls.levels, video), levelCeiling);
      if (index < 0 || index === pinnedLevel) return;
      const isUpgrade = pinnedLevel !== -1 && index > pinnedLevel;
      pinnedLevel = index;
      if (isInitial) hls.startLevel = index;
      // A short muted loop buffers end to end on the first pass and then replays
      // from that buffer, so `nextLevel` would queue an upgrade that never
      // loads. Switching `currentLevel` flushes and refetches at the new size.
      if (isUpgrade) hls.currentLevel = index;
      else hls.nextLevel = index;
    };

    let resizeObserver: ResizeObserver | undefined;
    let resizeFrame = 0;

    const setupHls = () => {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        autoStartLoad: false, // Wait until we've pinned a rendition to the element's size
        maxBufferLength: 10,
        maxMaxBufferLength: 30,
      });

      hlsRef.current = hls;
      hls.attachMedia(video);
      hls.loadSource(src);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        pinLevel(hls, true);
        hls.startLoad();
        initMuxMonitoring(hls);
        if (autoPlayRef.current) {
          if (mutedRef.current) {
            video.muted = true;
          }
          video.play().catch((err) => {
            console.log("Autoplay prevented by browser:", err);
          });
        }
      });

      // Re-pin when the element is resized (viewport changes, modal open/close,
      // or an intrinsically-sized video that had no box at manifest time).
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => {
          cancelAnimationFrame(resizeFrame);
          resizeFrame = requestAnimationFrame(() => pinLevel(hls, false));
        });
        resizeObserver.observe(video);
      }

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data.fatal) {
          const stalled =
            data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR ||
            data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT;
          if (stalled && pinnedLevel > 0 && stallDowngrades < MAX_STALL_DOWNGRADES) {
            stallDowngrades += 1;
            pinnedLevel -= 1;
            levelCeiling = pinnedLevel;
            hls.nextLevel = pinnedLevel;
          }
          return;
        }
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn("HLS network error, attempting to recover...");
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn("HLS media error, attempting to recover...");
            hls.recoverMediaError();
            break;
          default:
            console.warn("HLS fatal error, destroying instance");
            hls.destroy();
            break;
        }
      });
    };

    const playDirectSource = () => {
      video.src = src;
      initMuxMonitoring();
      if (autoPlayRef.current) {
        video.muted = true;
        video.play().catch((err) => {
          console.log("Autoplay prevented by browser:", err);
        });
      }
    };

    let streamingStarted = false;
    const startStreaming = () => {
      if (streamingStarted) return;
      streamingStarted = true;

      if (!isHlsSource) {
        playDirectSource();
      } else if (Hls.isSupported()) {
        setupHls();
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS — the browser handles rendition selection itself
        playDirectSource();
      } else {
        console.error("HLS is not supported in this browser");
      }
    };

    // Streaming every video at once starves each stream's bandwidth, which is
    // what drove the quality collapse in the first place. Load on approach.
    let intersectionObserver: IntersectionObserver | undefined;
    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            intersectionObserver?.disconnect();
            startStreaming();
          }
        },
        { rootMargin: PRELOAD_MARGIN },
      );
      intersectionObserver.observe(video);
    } else {
      startStreaming();
    }

    // Cleanup
    return () => {
      clearInterval(retryInterval);
      cancelAnimationFrame(resizeFrame);
      intersectionObserver?.disconnect();
      resizeObserver?.disconnect();
      video.removeEventListener('loadeddata', handleReady);
      video.removeEventListener('canplay', handleReady);
      video.removeEventListener('canplaythrough', handleReady);
      video.removeEventListener('progress', handleReady);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  // Only re-initialize video when src changes - all other props are stored in refs
  }, [src]);

  return (
    <video
      ref={videoRef}
      className={className}
      poster={poster}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      controls={false}
      playsInline
      webkit-playsinline="true"
      x-webkit-airplay="deny"
      disablePictureInPicture
      disableRemotePlayback
      preload="auto"
      controlsList="nodownload nofullscreen noremoteplayback noplaybackrate"
      style={{ 
        WebkitAppearance: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}




