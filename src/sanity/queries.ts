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
