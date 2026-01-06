import { groq } from "next-sanity";

// Query for all published projects (for listing)
export const PROJECTS_QUERY = groq`
  *[_type == "project" && isPublished == true] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    company,
    year,
    shortDescription,
    logo,
    heroImage
  }
`;

// Query for a single project by slug (with all content)
export const PROJECT_QUERY = groq`
  *[_type == "project" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    company,
    year,
    shortDescription,
    logo,
    heroImage,
    heroVideo,
    metadata[] {
      _key,
      label,
      value
    },
    content[] {
      _key,
      _type,
      ...
    },
    relatedProjects[]-> {
      _id,
      title,
      "slug": slug.current,
      company,
      year,
      shortDescription,
      heroImage
    }
  }
`;

// Query for all projects (including drafts, for development)
export const ALL_PROJECTS_QUERY = groq`
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    company,
    year,
    shortDescription,
    logo,
    heroImage,
    isPublished
  }
`;

// ============================================
// LIBRARY PAGE QUERIES
// ============================================

// Query for all books
export const BOOKS_QUERY = groq`
  *[_type == "book" && isPublished == true] | order(order asc, dateFinished desc) {
    _id,
    title,
    author,
    coverImage,
    coverUrl,
    rating,
    shelf,
    dateStarted,
    dateFinished,
    review
  }
`;

// Query for books by shelf
export const BOOKS_BY_SHELF_QUERY = groq`
  *[_type == "book" && isPublished == true && shelf == $shelf] | order(order asc, dateFinished desc) {
    _id,
    title,
    author,
    coverImage,
    coverUrl,
    rating,
    shelf,
    dateStarted,
    dateFinished,
    review
  }
`;

// Query for all available shelves (for dropdown)
export const BOOK_SHELVES_QUERY = groq`
  array::unique(*[_type == "book" && isPublished == true].shelf)
`;


