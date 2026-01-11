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

// Visibility setting for content sections
export type SectionVisibility = "both" | "locked" | "unlocked";

export interface MissionSection {
  _key: string;
  _type: "missionSection";
  visibility?: SectionVisibility;
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
  visibility?: SectionVisibility;
  title?: string;
  message?: string;
  contactEmail?: string;
  showPasswordProtection?: boolean;
  password?: string;
}

export interface FeatureSection {
  _key: string;
  _type: "featureSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  verticalPadding?: "normal" | "small" | "large";
  layout?: "side-by-side" | "stacked";
  mediaPosition?: "left" | "right";
  sectionNumber?: string;
  sectionLabel?: string;
  problemLabel?: string;
  heading: string;
  highlightedText?: string;
  highlightColor?: string;
  mediaType?: "image" | "video";
  image?: SanityImage;
  externalImageUrl?: string;
  muxPlaybackId?: string;
  imageAlt?: string;
  description?: any[]; // Portable Text
  descriptionHighlightedText?: string;
  descriptionHighlightColor?: string;
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
  visibility?: SectionVisibility;
  title?: string;
  layout?: "4-col" | "3-col" | "2-col" | "masonry";
  images?: GalleryImage[];
}

export interface TextSection {
  _key: string;
  _type: "textSection";
  visibility?: SectionVisibility;
  label?: string;
  heading?: string;
  highlightedText?: string;
  highlightColor?: string;
  body?: any[]; // Portable Text
  layout?: "full" | "two-col" | "centered" | "single-col";
}

export interface ImageSection {
  _key: string;
  _type: "imageSection";
  visibility?: SectionVisibility;
  image?: SanityImage;
  externalImageUrl?: string;
  alt?: string;
  caption?: string;
  size?: "full" | "large" | "medium" | "small";
  rounded?: boolean;
}

export interface VideoSection {
  _key: string;
  _type: "videoSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  size?: "full" | "medium";
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
  visibility?: SectionVisibility;
  sectionLabel?: string;
  sectionTitle?: string;
  highlightedText?: string;
  highlightColor?: string;
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
  visibility?: SectionVisibility;
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
  visibility?: SectionVisibility;
  label?: string;
  title: string;
  highlightedText?: string;
  highlightColor?: string;
  subtitle?: string;
  image?: SanityImage;
  imageCaption?: string;
  teamLabel?: string;
  teamMembers?: TeamMember[];
  description?: any[];
}

export interface DividerSection {
  _key: string;
  _type: "dividerSection";
  visibility?: SectionVisibility;
  style?: string;
}

export interface SectionTitleSection {
  _key: string;
  _type: "sectionTitleSection";
  visibility?: SectionVisibility;
  number?: string;
  numberColor?: string;
  title: string;
  titleColor?: string;
  lineColor?: string;
  showLine?: boolean;
  subtitle?: string;
  isSkipLinkStart?: boolean;
  isSkipLinkEnd?: boolean;
}

export interface PhoneVideoSection {
  _key: string;
  _type: "phoneVideoSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  layout?: "video-left" | "video-right";
  mediaType?: "video" | "gif";
  muxPlaybackId?: string;
  gifImage?: SanityImage;
  externalGifUrl?: string;
  emoji?: string;
  sectionNumber?: string;
  heading?: string;
  highlightedText?: string;
  highlightColor?: string;
  subheading?: string;
  bulletPoints?: string[];
}

export interface LearningItem {
  _key: string;
  emoji?: string;
  title: string;
  description?: string;
}

export interface LearningsSection {
  _key: string;
  _type: "learningsSection";
  visibility?: SectionVisibility;
  sectionTitle?: string;
  learnings?: LearningItem[];
}

export interface OverlayImageSection {
  _key: string;
  _type: "overlayImageSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  baseImage?: SanityImage;
  externalBaseImageUrl?: string;
  overlayImage?: SanityImage;
  externalOverlayImageUrl?: string;
  overlayPosition?: {
    x: number;
    y: number;
  };
  overlaySize?: "small" | "medium" | "large";
  size?: "full" | "large" | "medium" | "small";
  rounded?: boolean;
}

export interface TwoColumnTextImageSection {
  _key: string;
  _type: "twoColumnTextImageSection";
  visibility?: SectionVisibility;
  heading?: string;
  highlightedText?: string;
  highlightColor?: string;
  textContent?: any[]; // Portable Text
  backgroundColor?: string;
  image?: SanityImage;
  imageUrl?: string;
}

export interface TwoColumnImageSection {
  _key: string;
  _type: "twoColumnImageSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  label?: string;
  heading?: string;
  highlightedText?: string;
  highlightColor?: string;
  description?: any[]; // Portable Text
  layout?: "text-left" | "text-right" | "three-column" | "two-images";
  leftImageSize?: "small" | "medium" | "large";
  rightImageSize?: "small" | "medium" | "large";
  leftImage?: SanityImage;
  leftImageUrl?: string;
  leftImageCaption?: string;
  rightImage?: SanityImage;
  rightImageUrl?: string;
  rightImageCaption?: string;
  imageGap?: "small" | "medium" | "large";
  rounded?: boolean;
}

export interface TocItem {
  _key: string;
  image?: SanityImage;
  externalImageUrl?: string;
  number?: string;
  title: string;
  targetSectionId?: string;
}

export interface TableOfContentsSection {
  _key: string;
  _type: "tableOfContentsSection";
  visibility?: SectionVisibility;
  sectionNumber?: string;
  sectionTitle?: string;
  subtitle?: string;
  backgroundColor?: string;
  accentColor?: string;
  hintText?: string;
  sectionDescription?: string;
  items?: TocItem[];
}

export interface SectionHeaderBar {
  _key: string;
  _type: "sectionHeaderBar";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  textColor?: string;
  number?: string;
  title?: string;
  subtitle?: string;
  leftImage?: SanityImage;
  leftImageUrl?: string;
  rightImage?: SanityImage;
  rightImageUrl?: string;
  imageSize?: "small" | "medium" | "large";
  verticalPadding?: "small" | "normal" | "large";
}

export interface HighlightCard {
  _key: string;
  cardLayout?: "stacked" | "side-by-side";
  imagePosition?: "left" | "right";
  headline: string;
  highlightedText?: string;
  highlightColor?: string;
  headlineColor?: string;
  image?: SanityImage;
  externalImageUrl?: string;
  imageAspectRatio?: "square" | "landscape" | "portrait" | "auto";
  imageRoundedCorners?: "none" | "small" | "medium" | "large" | "full";
  description?: any[]; // Portable Text (rich text)
  cardBackgroundColor?: string;
}

export interface HighlightCardSection {
  _key: string;
  _type: "highlightCardSection";
  visibility?: SectionVisibility;
  backgroundColor?: string;
  layout?: "2-col" | "3-col" | "stacked";
  cardStyle?: "with-bg" | "no-bg" | "with-border";
  showDividers?: boolean;
  cards?: HighlightCard[];
}

export interface StatCard {
  _key: string;
  statValue: string;
  statColorOverride?: string;
  description?: string;
}

export interface StatsCardSection {
  _key: string;
  _type: "statsCardSection";
  visibility?: SectionVisibility;
  sectionTitle?: string;
  titleColor?: string;
  showDividerLine?: boolean;
  statColor?: string;
  layout?: "2-col" | "3-col" | "4-col";
  cards?: StatCard[];
}

export type ContentSection =
  | MissionSection
  | ProtectedSection
  | FeatureSection
  | PhoneVideoSection
  | LearningsSection
  | SectionTitleSection
  | GallerySection
  | TextSection
  | ImageSection
  | OverlayImageSection
  | VideoSection
  | TestimonialSection
  | ProjectCardSection
  | SideQuestSection
  | DividerSection
  | TwoColumnImageSection
  | TwoColumnTextImageSection
  | TableOfContentsSection
  | SectionHeaderBar
  | HighlightCardSection
  | StatsCardSection;

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
  instagramUrl?: string;
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
  goodreadsUrl?: string;
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


