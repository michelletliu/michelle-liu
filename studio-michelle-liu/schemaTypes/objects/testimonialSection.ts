import {defineType, defineField} from 'sanity'
import {CommentIcon} from '@sanity/icons'

export const testimonialSection = defineType({
  name: 'testimonialSection',
  title: 'Testimonial Section',
  type: 'object',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'visibility',
      title: 'Visibility',
      type: 'string',
      description: 'When should this section be visible?',
      options: {
        list: [
          {title: 'Both (locked & unlocked)', value: 'both'},
          {title: 'Locked only', value: 'locked'},
          {title: 'Unlocked only', value: 'unlocked'},
        ],
        layout: 'radio',
      },
      initialValue: 'both',
    }),
    defineField({
      name: 'sectionLabel',
      title: 'Section Label',
      type: 'string',
      description: 'Label shown above the section title (e.g., "Feedback")',
      initialValue: 'Feedback',
    }),
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      description: 'Title for the testimonial section',
      initialValue: 'Kind words from my manager',
    }),
    defineField({
      name: 'quote',
      title: 'Quote (Short)',
      type: 'text',
      rows: 4,
      description: 'Short version of the quote shown initially',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'fullQuote',
      title: 'Full Quote (Paragraphs)',
      type: 'array',
      of: [{type: 'text'}],
      description: 'Full quote shown when "Read more" is clicked. Each item is a paragraph.',
    }),
    defineField({
      name: 'authorName',
      title: 'Author Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'authorTitle',
      title: 'Author Title / Role',
      type: 'string',
    }),
    defineField({
      name: 'authorCompany',
      title: 'Author Company',
      type: 'string',
    }),
    defineField({
      name: 'authorImage',
      title: 'Author Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      quote: 'quote',
      author: 'authorName',
      media: 'authorImage',
    },
    prepare({quote, author, media}) {
      const shortQuote = quote?.length > 50 ? quote.substring(0, 50) + '...' : quote
      return {
        title: `"${shortQuote}"`,
        subtitle: `— ${author}`,
        media,
      }
    },
  },
})



