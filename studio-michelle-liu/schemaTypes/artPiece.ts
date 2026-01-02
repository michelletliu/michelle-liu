import {defineType, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons'

export const artPiece = defineType({
  name: 'artPiece',
  title: 'Art Piece',
  type: 'document',
  icon: ImageIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'artType',
      title: 'Art Type',
      type: 'string',
      options: {
        list: [
          {title: 'Painting', value: 'painting'},
          {title: 'Conceptual', value: 'conceptual'},
          {title: 'Graphite', value: 'graphite'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      description: 'e.g., Oil on canvas, Watercolor, Digital',
      type: 'string',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      description: 'e.g., 24×36',
      type: 'string',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional longer description of the artwork',
      type: 'text',
      rows: 3,
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
      artType: 'artType',
      medium: 'medium',
      year: 'year',
      media: 'image',
    },
    prepare({title, artType, medium, year, media}) {
      const typeLabel = artType ? artType.charAt(0).toUpperCase() + artType.slice(1) : ''
      const subtitle = [typeLabel, medium, year].filter(Boolean).join(' • ')
      return {
        title,
        subtitle,
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



