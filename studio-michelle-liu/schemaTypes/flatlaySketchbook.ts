import {defineType, defineField} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const flatlaySketchbook = defineType({
  name: 'flatlaySketchbook',
  title: 'Flatlay Sketchbook',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'image',
      title: 'Sketchbook Image',
      description: 'A flatlay photo of your sketchbook spread',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      description: 'The date of this sketch (e.g., mar 04, 2025)',
      type: 'date',
      options: {
        dateFormat: 'MMM DD, YYYY',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      description: 'Where this sketch was made (e.g., "ucla", "home")',
      type: 'string',
    }),
    defineField({
      name: 'note',
      title: 'Note',
      description: 'Optional note about this sketch',
      type: 'text',
      rows: 2,
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
      date: 'date',
      note: 'note',
      media: 'image',
    },
    prepare({date, note, media}) {
      const formattedDate = date 
        ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toLowerCase()
        : 'No date';
      return {
        title: formattedDate,
        subtitle: note || '',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Date (Newest First)',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
    {
      title: 'Date (Oldest First)',
      name: 'dateAsc',
      by: [{field: 'date', direction: 'asc'}],
    },
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})
