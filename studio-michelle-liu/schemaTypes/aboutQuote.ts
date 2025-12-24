import {defineType, defineField} from 'sanity'
import {BlockquoteIcon} from '@sanity/icons'

/**
 * Quotes for the About page shelf section.
 */
export const aboutQuote = defineType({
  name: 'aboutQuote',
  title: 'Quote',
  type: 'document',
  icon: BlockquoteIcon,
  fields: [
    defineField({
      name: 'emoji',
      title: 'Emoji',
      description: 'Emoji to display above the quote',
      type: 'string',
      initialValue: '💬',
    }),
    defineField({
      name: 'title',
      title: 'Quote Title',
      description: 'Short title/phrase for the quote card',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Quote Text',
      description: 'The actual quote content',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'underlinedText',
      title: 'Underlined Text',
      description: 'Copy and paste the exact portion of the quote text that should be underlined. The underline will animate in from left to right when scrolling into view.',
      type: 'string',
    }),
    defineField({
      name: 'author',
      title: 'Author/Attribution',
      description: 'Who said this quote',
      type: 'string',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
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
      emoji: 'emoji',
      author: 'author',
    },
    prepare({title, emoji, author}) {
      return {
        title: `${emoji || '💬'} ${title}`,
        subtitle: author || 'Quote',
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})


