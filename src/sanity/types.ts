// Types for Sanity project data

export interface SanityImage {
  _type: "image";
  asset: {
    _ref: string;
    _type: "reference";
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

// ============================================
// ART PAGE TYPES
// ============================================

export interface SanityImageWithKey extends SanityImage {
  _key: string;
  caption?: string;
}

export type ArtType = "painting" | "conceptual" | "graphite";

export interface ArtPiece {
  _id: string;
  title: string;
  artType: ArtType;
  image: SanityImage;
  medium?: string;
  size?: string;
  year?: string;
  description?: string;
}

export interface Sketchbook {
  _id: string;
  title: string;
  sidebarLabel?: string;
  date: string;
  description?: string;
  images: SanityImageWithKey[];
}

export interface Mural {
  _id: string;
  title: string;
  sidebarLabel?: string;
  location: string;
  date: string;
  description?: string;
  images: SanityImageWithKey[];
}

export interface MetadataItem {
  _key: string;
  label: string;
  value: string[];
  subValue?: string;
}

export interface MissionSection {
  _key: string;
  _type: "missionSection";
  sectionLabel?: string;
  missionTitle: string;
  highlightedText?: string;
  highlightColor?: string;
  missionImage?: SanityImage;
  missionDescription?: any[]; // Portable Text
  missionNote?: string;
}

export interface ProtectedSection {
  _key: string;
  _type: "protectedSection";
  title?: string;
  message?: string;
  contactEmail?: string;
  showPasswordProtection?: boolean;
  password?: string;
}

export interface GalleryImage {
  _key: string;
  asset: {
    _ref: string;
    _type: "reference";
  };
  alt?: string;
  caption?: string;
}

export interface GallerySection {
  _key: string;
  _type: "gallerySection";
  title?: string;
  layout?: "4-col" | "3-col" | "2-col" | "masonry";
  images?: GalleryImage[];
}

export interface TextSection {
  _key: string;
  _type: "textSection";
  label?: string;
  heading?: string;
  body?: any[]; // Portable Text
  layout?: "full" | "two-col" | "centered";
}

export interface ImageSection {
  _key: string;
  _type: "imageSection";
  image: SanityImage;
  alt?: string;
  caption?: string;
  size?: "full" | "large" | "medium";
  rounded?: boolean;
}

export interface VideoSection {
  _key: string;
  _type: "videoSection";
  title?: string;
  videoType?: "mux" | "youtube" | "vimeo";
  muxPlaybackId?: string;
  youtubeUrl?: string;
  vimeoUrl?: string;
  posterImage?: SanityImage;
  caption?: string;
  autoplay?: boolean;
}

export interface TestimonialSection {
  _key: string;
  _type: "testimonialSection";
  sectionLabel?: string;
  sectionTitle?: string;
  quote: string;
  fullQuote?: string[];
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorImage?: SanityImage;
}

export type ContentSection =
  | MissionSection
  | ProtectedSection
  | GallerySection
  | TextSection
  | ImageSection
  | VideoSection
  | TestimonialSection;

export interface Project {
  _id: string;
  title: string;
  slug: string;
  company: "apple" | "roblox" | "adobe" | "nasa";
  year?: string;
  shortDescription?: string;
  logo?: SanityImage;
  heroImage?: SanityImage;
  heroVideo?: string;
  metadata?: MetadataItem[];
  content?: ContentSection[];
  relatedProjects?: Project[];
  isPublished?: boolean;
  order?: number;
}
