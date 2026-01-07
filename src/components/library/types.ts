import type { SanityImage } from '../../sanity/types';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  rating: number;
  year?: string;
  isFavorite?: boolean;
  goodreadsUrl?: string;
  // Legacy fields (from book schema)
  shelf?: string;
  yearFinished?: string;
  datesRead?: {
    start: string;
    end: string;
  };
  review?: string;
}

// Raw Sanity book data structure (legacy - uses book schema)
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
  goodreadsUrl?: string;
}

// Raw Sanity shelfItem data structure (for books from shelfItem schema)
export interface ShelfBookData {
  _id: string;
  title: string;
  author?: string;
  cover?: SanityImage;
  externalCoverUrl?: string;
  rating?: number;
  year?: string;
  isLibraryFavorite?: boolean;
  goodreadsUrl?: string;
}
