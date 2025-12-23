import {defineType, defineField, defineArrayMember} from 'sanity'
import {EarthGlobeIcon} from '@sanity/icons'

export const mural = defineType({
  name: 'mural',
  title: 'Mural',
  type: 'document',
  icon: EarthGlobeIcon,
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
      description: 'How this gallery appears in the sidebar (e.g., "DOWNTOWN", "SF")',
      type: 'string',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      description: 'e.g., Downtown Los Angeles, San Francisco',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      description: 'e.g., March 2024',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Short description of the mural (1-2 lines)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'images',
      title: 'Mural Images',
      description: 'Photos of the mural from different angles or stages',
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
      location: 'location',
      date: 'date',
      media: 'images.0',
    },
    prepare({title, location, date, media}) {
      return {
        title,
        subtitle: `${location} • ${date}`,
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
      title: 'Date (Newest)',
      name: 'dateDesc',
      by: [{field: 'date', direction: 'desc'}],
    },
  ],
})
