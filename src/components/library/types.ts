import type { SanityImage } from '../../sanity/types';

export interface Book {
  id: string;
  title: string;
  author: string;
  coverImage: string;
  rating: number;
  shelf: string;
  yearFinished?: string;
  datesRead?: {
    start: string;
    end: string;
  };
  review?: string;
  goodreadsUrl?: string;
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
  goodreadsUrl?: string;
}
