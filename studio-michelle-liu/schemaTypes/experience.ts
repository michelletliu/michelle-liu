import {defineType, defineField} from 'sanity'
import {CaseIcon} from '@sanity/icons'

/**
 * Work experience items for the About page.
 */
export const experience = defineType({
  name: 'experience',
  title: 'Experience',
  type: 'document',
  icon: CaseIcon,
  fields: [
    defineField({
      name: 'company',
      title: 'Company/Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role/Position',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Company Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'period',
      title: 'Time Period',
      description: 'e.g., "2024-Present" or "2022-2024"',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional description of your role',
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
      title: 'company',
      role: 'role',
      period: 'period',
      media: 'logo',
    },
    prepare({title, role, period, media}) {
      return {
        title,
        subtitle: [role, period].filter(Boolean).join(' • '),
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




