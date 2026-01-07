import {defineType, defineField} from 'sanity'
import {BulbOutlineIcon} from '@sanity/icons'

export const missionSection = defineType({
  name: 'missionSection',
  title: 'Mission / Overview Section',
  type: 'object',
  icon: BulbOutlineIcon,
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
      initialValue: 'The Mission',
    }),
    defineField({
      name: 'missionTitle',
      title: 'Mission Title',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'highlightedText',
      title: 'Highlighted Text',
      type: 'string',
      description: 'Text within the title to highlight (e.g., "user connection")',
    }),
    defineField({
      name: 'highlightColor',
      title: 'Highlight Color',
      type: 'string',
      description: 'Color for the highlighted text (e.g., "#3b82f6" for blue, "#ef4444" for red)',
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'missionImage',
      title: 'Mission Image',
      type: 'image',
      description: 'Optional image displayed between title and description. When provided, the layout will be centered.',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'missionDescription',
      title: 'Mission Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'missionNote',
      title: 'Note (Italic)',
      type: 'string',
      description: 'Optional italic note displayed at the bottom (e.g., "Designs are blurred due to confidentiality.")',
    }),
  ],
  preview: {
    select: {
      title: 'missionTitle',
      label: 'sectionLabel',
      media: 'missionImage',
    },
    prepare({title, label, media}) {
      return {
        title: label || 'Mission Section',
        subtitle: title,
        media,
      }
    },
  },
})



