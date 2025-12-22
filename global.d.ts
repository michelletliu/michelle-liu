declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

declare module "mux-embed" {
  interface MuxOptions {
    data: {
      env_key: string;
      player_name?: string;
      player_init_time?: number;
      video_id?: string;
      video_title?: string;
      viewer_user_id?: string;
      [key: string]: string | number | undefined;
    };
    hlsjs?: unknown;
    Hls?: unknown;
  }

  const mux: {
    monitor: (element: HTMLVideoElement, options: MuxOptions | Record<string, unknown>) => void;
  };

  export default mux;
}

