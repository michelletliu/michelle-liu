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

export interface ProjectCard {
  _key: string;
  label?: string;
  emoji?: string;
  title: string;
  linkColor?: string;
  image?: SanityImage;
}

export interface ProjectCardSection {
  _key: string;
  _type: "projectCardSection";
  cards?: ProjectCard[];
}

export interface TeamMember {
  _key: string;
  name: string;
  link?: string;
}

export interface SideQuestSection {
  _key: string;
  _type: "sideQuestSection";
  label?: string;
  title: string;
  subtitle?: string;
  image?: SanityImage;
  teamLabel?: string;
  teamMembers?: TeamMember[];
  description?: any[];
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
  | ProjectCardSection
  | SideQuestSection
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
// ABOUT PAGE TYPES
// ============================================

export interface AboutPageData {
  _id: string;
  profilePhoto?: SanityImage;
  name?: string;
  tagline?: string;
  bio?: string;
  location?: string;
  education?: {
    school?: string;
    degree?: string;
    years?: string;
  };
  socialLinks?: {
    linkedIn?: string;
    twitter?: string;
    email?: string;
    goodreads?: string;
    spotify?: string;
    letterboxd?: string;
  };
  experienceTitle?: string;
  communityTitle?: string;
  shelfTitle?: string;
  loreTitle?: string;
}

export interface Experience {
  _id: string;
  company: string;
  role: string;
  logo?: SanityImage;
  period?: string;
  description?: string;
  order?: number;
}

export interface CommunityPhoto {
  _key: string;
  image?: SanityImage;
  caption?: string;
  rotation?: number;
  orientation?: "horizontal" | "vertical";
  yOffset?: string;
  xOffset?: string;
}

export interface Community {
  _id: string;
  title: string;
  sidebarName?: string;
  logo?: SanityImage;
  description?: string;
  photos?: CommunityPhoto[];
  order?: number;
}

export type ShelfMediaType = "book" | "music" | "movie";

export interface ShelfItem {
  _id: string;
  title: string;
  mediaType: ShelfMediaType;
  cover?: SanityImage;
  externalCoverUrl?: string;
  author?: string;
  year?: string;
  rating?: number;
  isFeatured?: boolean;
  order?: number;
  letterboxdSlug?: string;
  spotifyUrl?: string;
}

export interface LoreItem {
  _id: string;
  headline: string;
  image?: SanityImage;
  imageBackground?: string;
  date?: string;
  description?: string;
  link?: string;
  fullStory?: any[]; // Portable Text
  order?: number;
}

export interface AboutQuote {
  _id: string;
  emoji?: string;
  title: string;
  text: string;
  underlinedText?: string;
  author?: string;
  order?: number;
}

// ============================================
// LIBRARY PAGE TYPES
// ============================================

export type BookShelf = "favorites" | "read" | "currently-reading" | "want-to-read";

export interface SanityBook {
  _id: string;
  title: string;
  author: string;
  coverImage?: SanityImage;
  coverUrl?: string;
  rating: number;
  shelf: BookShelf;
  dateStarted?: string;
  dateFinished?: string;
  review?: string;
  order?: number;
}


