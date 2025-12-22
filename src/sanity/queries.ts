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
