import { useEffect, useRef } from "react";
import Hls from "hls.js";
import mux from "mux-embed";

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
  onLoaded?: () => void;
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
      if (!video.paused) return; // Already playing
      video.muted = true; // Ensure muted before every play attempt
      video.play().catch(() => {
        // Silently fail - will retry on user interaction
      });
    };

    // Handler for when video has enough data to play
    const handleCanPlay = () => {
      if (onLoadedRef.current && !hasCalledOnLoaded.current) {
        hasCalledOnLoaded.current = true;
        onLoadedRef.current();
      }
      // Try to play when video is ready
      if (autoPlayRef.current) {
        attemptPlay();
      }
    };

    // Retry playing on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && autoPlayRef.current) {
        attemptPlay();
      }
    };

    // Retry playing on first user interaction (touch/click anywhere)
    const handleUserInteraction = () => {
      if (autoPlayRef.current) {
        attemptPlay();
      }
      // Remove listeners after first interaction
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };

    // Listen for canplaythrough event (video is ready to play through without buffering)
    video.addEventListener('canplaythrough', handleCanPlay);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('click', handleUserInteraction, { passive: true });

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

    if (isHlsSource) {
      // HLS.js streaming
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          startLevel: -1,                  // Let ABR auto-select based on bandwidth
          abrEwmaDefaultEstimate: 8000000, // Assume ~8Mbps so ABR picks a high quality level by default
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
        });

        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, _data) => {
          // Let ABR handle quality — no quality lock so playback starts immediately
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

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
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
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS support
        video.src = src;
        initMuxMonitoring();
        if (autoPlayRef.current) {
          video.muted = true;
          video.play().catch((err) => {
            console.log("Autoplay prevented by browser:", err);
          });
        }
      } else {
        console.error("HLS is not supported in this browser");
      }
    } else {
      // Regular video file (MP4, WebM, etc.)
      video.src = src;
      initMuxMonitoring();
      if (autoPlayRef.current) {
        video.muted = true;
        video.play().catch((err) => {
          console.log("Autoplay prevented by browser:", err);
        });
      }
    }

    // Cleanup
    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
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
        pointerEvents: 'none'
      }}
    />
  );
}




