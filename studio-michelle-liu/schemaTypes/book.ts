import {defineField, defineType} from 'sanity'

export const book = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Upload a book cover image',
    }),
    defineField({
      name: 'coverUrl',
      title: 'Cover URL',
      type: 'url',
      description: 'Alternative: paste a URL to a book cover (e.g., from Goodreads). Used if no image is uploaded.',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
      options: {
        list: [
          {title: '1 Star', value: 1},
          {title: '2 Stars', value: 2},
          {title: '3 Stars', value: 3},
          {title: '4 Stars', value: 4},
          {title: '5 Stars', value: 5},
        ],
      },
    }),
    defineField({
      name: 'shelf',
      title: 'Shelf',
      type: 'string',
      validation: (Rule) => Rule.required(),
      options: {
        list: [
          {title: 'Favorites', value: 'favorites'},
          {title: 'Read', value: 'read'},
          {title: 'Currently Reading', value: 'currently-reading'},
          {title: 'Want to Read', value: 'want-to-read'},
        ],
        layout: 'radio',
      },
      initialValue: 'read',
    }),
    defineField({
      name: 'dateStarted',
      title: 'Date Started',
      type: 'date',
      options: {
        dateFormat: 'MMMM D, YYYY',
      },
    }),
    defineField({
      name: 'dateFinished',
      title: 'Date Finished',
      type: 'date',
      options: {
        dateFormat: 'MMMM D, YYYY',
      },
    }),
    defineField({
      name: 'review',
      title: 'Review',
      type: 'text',
      rows: 4,
      description: 'Your personal review or notes about this book',
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Used to sort books within a shelf (lower numbers appear first)',
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      description: 'Set to true to show this book on the library page',
      initialValue: true,
    }),
    defineField({
      name: 'goodreadsUrl',
      title: 'Goodreads URL',
      type: 'url',
      description: 'Link to this book on Goodreads',
    }),
  ],
  orderings: [
    {
      title: 'Rating (High to Low)',
      name: 'ratingDesc',
      by: [{field: 'rating', direction: 'desc'}],
    },
    {
      title: 'Custom Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
    {
      title: 'Date Finished (Recent)',
      name: 'dateFinishedDesc',
      by: [{field: 'dateFinished', direction: 'desc'}],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      author: 'author',
      shelf: 'shelf',
      rating: 'rating',
      media: 'coverImage',
    },
    prepare({title, author, shelf, rating, media}) {
      const stars = '★'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0))
      return {
        title: title,
        subtitle: `${author} • ${shelf} • ${stars}`,
        media: media,
      }
    },
  },
})
