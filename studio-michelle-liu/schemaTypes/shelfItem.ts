import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

/**
 * Shelf items for the About page - Books, Music, and Movies.
 */
export const shelfItem = defineType({
  name: 'shelfItem',
  title: 'Shelf Item',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          {title: 'Book', value: 'book'},
          {title: 'Music', value: 'music'},
          {title: 'Movie', value: 'movie'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'cover',
      title: 'Cover Image',
      description: 'Book cover, album art, or movie poster',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'externalCoverUrl',
      title: 'External Cover URL',
      description: 'Alternative: URL to an external cover image (e.g., from TMDb). Used if no cover image is uploaded.',
      type: 'url',
    }),
    defineField({
      name: 'author',
      title: 'Author/Artist/Director',
      type: 'string',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      description: 'Year read/listened/watched (for filtering)',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      description: 'Optional rating (1-5 stars)',
      type: 'number',
      validation: (rule) => rule.min(1).max(5),
    }),
    defineField({
      name: 'isFeatured',
      title: 'Featured (About Page)',
      description: 'Show in the collapsed "Default" state on About page shelf',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'isLibraryFavorite',
      title: 'Library Favorite ⭐',
      description: 'Show in the "favorites" shelf on the Library page',
      type: 'boolean',
      initialValue: false,
      hidden: ({document}) => document?.mediaType !== 'book',
    }),
    defineField({
      name: 'goodreadsUrl',
      title: 'Goodreads URL',
      description: 'Full Goodreads book URL (e.g., "https://www.goodreads.com/book/show/...")',
      type: 'url',
      hidden: ({document}) => document?.mediaType !== 'book',
    }),
    defineField({
      name: 'letterboxdSlug',
      title: 'Letterboxd Slug',
      description: 'URL slug for your Letterboxd review (e.g., "left-handed-girl" for letterboxd.com/liumichelle/film/left-handed-girl/)',
      type: 'string',
      hidden: ({document}) => document?.mediaType !== 'movie',
    }),
    defineField({
      name: 'spotifyUrl',
      title: 'Spotify URL',
      description: 'Full Spotify album URL (e.g., "https://open.spotify.com/album/...")',
      type: 'url',
      hidden: ({document}) => document?.mediaType !== 'music',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first within each media type',
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      mediaType: 'mediaType',
      author: 'author',
      year: 'year',
      media: 'cover',
    },
    prepare({title, mediaType, author, year, media}) {
      const typeEmoji = mediaType === 'book' ? '📚' : mediaType === 'music' ? '🎵' : '🎬'
      return {
        title: `${typeEmoji} ${title}`,
        subtitle: [author, year].filter(Boolean).join(' • '),
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Year (Newest)',
      name: 'yearDesc',
      by: [{field: 'year', direction: 'desc'}],
    },
  ],
})


