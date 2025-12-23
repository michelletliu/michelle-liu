import {defineType, defineField, defineArrayMember} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const sketchbook = defineType({
  name: 'sketchbook',
  title: 'Sketchbook',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sidebarLabel',
      title: 'Sidebar Label',
      description: 'How this gallery appears in the sidebar (e.g., "AIRPORT", "UCLA")',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Date',
      description: 'e.g., Summer 2024, 2023-2024',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Sketchbook Pages',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
          ],
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional description of this sketchbook',
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
      title: 'title',
      date: 'date',
      media: 'images.0',
    },
    prepare({title, date, media}) {
      return {
        title,
        subtitle: date,
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
