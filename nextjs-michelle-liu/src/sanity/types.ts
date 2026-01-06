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

export interface MetadataItem {
  _key: string;
  label: string;
  value: string[];
}

export interface MissionSection {
  _key: string;
  _type: "missionSection";
  sectionLabel?: string;
  missionTitle: string;
  missionDescription?: any[]; // Portable Text
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
  quote: string;
  authorName: string;
  authorTitle?: string;
  authorCompany?: string;
  authorImage?: SanityImage;
}

export interface DividerSection {
  _key: string;
  _type: "dividerSection";
  style?: string;
}

export type ContentSection =
  | MissionSection
  | ProtectedSection
  | GallerySection
  | TextSection
  | ImageSection
  | VideoSection
  | TestimonialSection
  | DividerSection;

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

// ============================================
// LIBRARY TYPES
// ============================================

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  rating: number;
  shelf: string;
  datesRead?: {
    start: string;
    end: string;
  };
  review?: string;
}

// Raw Sanity book data structure
export interface SanityBookData {
  _id: string;
  title: string;
  author: string;
  coverImage?: SanityImage;
  coverUrl?: string;
  rating: number;
  shelf: string;
  dateStarted?: string;
  dateFinished?: string;
  review?: string;
}


