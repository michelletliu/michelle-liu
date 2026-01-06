// GROQ queries for fetching projects

// Query for all projects (for listing/cards)
export const PROJECTS_QUERY = `
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    company,
    year,
    shortDescription,
    logo,
    heroImage,
    heroVideo,
    isPublished
  }
`;

// ============================================
// ART PAGE QUERIES
// ============================================

// Query for all art pieces (gallery)
export const ART_PIECES_QUERY = `
  *[_type == "artPiece" && isPublished == true] | order(year desc, order asc) {
    _id,
    title,
    artType,
    image,
    medium,
    size,
    year,
    description
  }
`;

// Query for art pieces by type (painting, conceptual, graphite)
export const ART_PIECES_BY_TYPE_QUERY = `
  *[_type == "artPiece" && isPublished == true && artType == $artType] | order(year desc, order asc) {
    _id,
    title,
    artType,
    image,
    medium,
    size,
    year,
    description
  }
`;

// Query for all sketchbooks
export const SKETCHBOOKS_QUERY = `
  *[_type == "sketchbook" && isPublished == true] | order(order asc) {
    _id,
    title,
    sidebarLabel,
    date,
    description,
    images[] {
      _key,
      asset,
      caption
    }
  }
`;

// Query for all murals
export const MURALS_QUERY = `
  *[_type == "mural" && isPublished == true] | order(order asc) {
    _id,
    title,
    sidebarLabel,
    location,
    date,
    description,
    images[] {
      _key,
      asset,
      caption
    }
  }
`;

// Query for a single project by slug (with all content)
export const PROJECT_BY_SLUG_QUERY = `
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
      value,
      subValue
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

// Query for a single project by company (e.g., "apple", "roblox")
export const PROJECT_BY_COMPANY_QUERY = `
  *[_type == "project" && company == $company][0] {
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
      value,
      subValue
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

// ============================================
// ABOUT PAGE QUERIES
// ============================================

// Query for the About page singleton document
export const ABOUT_PAGE_QUERY = `
  *[_type == "aboutPage"][0] {
    _id,
    profilePhoto,
    name,
    tagline,
    bio,
    location,
    education {
      school,
      degree,
      years
    },
    socialLinks {
      linkedIn,
      twitter,
      email,
      goodreads,
      spotify,
      letterboxd
    },
    experienceTitle,
    communityTitle,
    shelfTitle,
    loreTitle
  }
`;

// Query for all experience items
export const EXPERIENCES_QUERY = `
  *[_type == "experience" && isPublished == true] | order(order asc) {
    _id,
    company,
    role,
    logo,
    period,
    description
  }
`;

// Query for all community items
export const COMMUNITIES_QUERY = `
  *[_type == "community" && isPublished == true] | order(order asc) {
    _id,
    title,
    sidebarName,
    logo,
    description,
    instagramUrl,
    photos[] {
      _key,
      image,
      caption,
      rotation,
      orientation,
      yOffset,
      xOffset
    }
  }
`;

// Query for shelf items (books, music, movies)
export const SHELF_ITEMS_QUERY = `
  *[_type == "shelfItem" && isPublished == true] | order(isFeatured desc, order asc) {
    _id,
    title,
    mediaType,
    cover,
    externalCoverUrl,
    author,
    year,
    rating,
    isFeatured,
    goodreadsUrl,
    letterboxdSlug,
    spotifyUrl
  }
`;

// Query for shelf items by media type
export const SHELF_ITEMS_BY_TYPE_QUERY = `
  *[_type == "shelfItem" && isPublished == true && mediaType == $mediaType] | order(order asc) {
    _id,
    title,
    mediaType,
    cover,
    externalCoverUrl,
    author,
    year,
    rating,
    isFeatured
  }
`;

// Query for featured shelf items only (for default/collapsed state)
export const FEATURED_SHELF_ITEMS_QUERY = `
  *[_type == "shelfItem" && isPublished == true && isFeatured == true] | order(order asc) {
    _id,
    title,
    mediaType,
    cover,
    externalCoverUrl,
    author,
    year,
    rating
  }
`;

// Query for all lore items
export const LORE_ITEMS_QUERY = `
  *[_type == "loreItem" && isPublished == true] | order(order asc) {
    _id,
    headline,
    image,
    imageBackground,
    date,
    description,
    link,
    fullStory
  }
`;

// Query for all quotes
export const QUOTES_QUERY = `
  *[_type == "aboutQuote" && isPublished == true] | order(order asc) {
    _id,
    emoji,
    title,
    text,
    underlinedText,
    author
  }
`;

// ============================================
// LIBRARY PAGE QUERIES
// ============================================

// Query for all books
export const BOOKS_QUERY = `
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
    review,
    goodreadsUrl
  }
`;

// Query for books by shelf
export const BOOKS_BY_SHELF_QUERY = `
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
    review,
    goodreadsUrl
  }
`;

// Query for all available shelves (for dropdown)
export const BOOK_SHELVES_QUERY = `
  array::unique(*[_type == "book" && isPublished == true].shelf)
`;


