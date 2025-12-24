import {defineType, defineField} from 'sanity'
import {UserIcon} from '@sanity/icons'

/**
 * Singleton document for the About page main content.
 * Only one instance of this should exist.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  icon: UserIcon,
  fields: [
    // Profile Section
    defineField({
      name: 'profilePhoto',
      title: 'Profile Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      initialValue: 'Michelle Liu',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      description: 'Short description under your name',
      type: 'string',
      initialValue: 'Product Designer',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      description: 'Main bio text for the About page',
      type: 'text',
      rows: 6,
    }),

    // Location & Education
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'San Francisco, CA',
    }),
    defineField({
      name: 'education',
      title: 'Education',
      type: 'object',
      fields: [
        defineField({
          name: 'school',
          title: 'School',
          type: 'string',
        }),
        defineField({
          name: 'degree',
          title: 'Degree',
          type: 'string',
        }),
        defineField({
          name: 'years',
          title: 'Years',
          type: 'string',
        }),
      ],
    }),

    // Social Links
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        defineField({
          name: 'linkedIn',
          title: 'LinkedIn URL',
          type: 'url',
        }),
        defineField({
          name: 'twitter',
          title: 'Twitter/X URL',
          type: 'url',
        }),
        defineField({
          name: 'email',
          title: 'Email',
          type: 'string',
        }),
        defineField({
          name: 'goodreads',
          title: 'Goodreads URL',
          type: 'url',
        }),
        defineField({
          name: 'spotify',
          title: 'Spotify URL',
          type: 'url',
        }),
        defineField({
          name: 'letterboxd',
          title: 'Letterboxd URL',
          type: 'url',
        }),
      ],
    }),

    // Featured Section Titles
    defineField({
      name: 'experienceTitle',
      title: 'Experience Section Title',
      type: 'string',
      initialValue: 'Experience',
    }),
    defineField({
      name: 'communityTitle',
      title: 'Community Section Title',
      type: 'string',
      initialValue: 'Community',
    }),
    defineField({
      name: 'shelfTitle',
      title: 'Shelf Section Title',
      type: 'string',
      initialValue: 'Shelf',
    }),
    defineField({
      name: 'loreTitle',
      title: 'Lore Section Title',
      type: 'string',
      initialValue: 'Lore',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'profilePhoto',
    },
    prepare({title, media}) {
      return {
        title: 'About Page',
        subtitle: title || 'Michelle Liu',
        media,
      }
    },
  },
})


