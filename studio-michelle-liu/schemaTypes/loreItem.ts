import {defineType, defineField} from 'sanity'
import {SparkleIcon} from '@sanity/icons'

/**
 * Lore items - Stories and experiences for the About page.
 */
export const loreItem = defineType({
  name: 'loreItem',
  title: 'Lore Item',
  type: 'document',
  icon: SparkleIcon,
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      description: 'Short, catchy title for the story',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'imageBackground',
      title: 'Image Background Color',
      description: 'Fallback background color (hex code, e.g., #e3dff4)',
      type: 'string',
      initialValue: '#e3dff4',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      description: 'When this happened (e.g., "Summer 2023")',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Short description shown on the card',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'link',
      title: 'Link',
      description: 'Optional URL to link to when clicked',
      type: 'url',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'fullStory',
      title: 'Full Story',
      description: 'Optional: Full story content for modal/expansion',
      type: 'array',
      of: [{type: 'block'}],
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
      title: 'headline',
      date: 'date',
      media: 'image',
    },
    prepare({title, date, media}) {
      return {
        title,
        subtitle: date || 'Lore',
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
  ],
})


