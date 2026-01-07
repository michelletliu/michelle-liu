import {defineType, defineField} from 'sanity'
import {BlockContentIcon} from '@sanity/icons'

export const textSection = defineType({
  name: 'textSection',
  title: 'Text Section',
  type: 'object',
  icon: BlockContentIcon,
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
      name: 'label',
      title: 'Section Label',
      type: 'string',
      description: 'Small label above the content (e.g., "Background", "Process")',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body Content',
      type: 'array',
      of: [{type: 'block'}],
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Two Column (Label + Content)', value: 'two-col'},
          {title: 'Centered', value: 'centered'},
        ],
        layout: 'radio',
      },
      initialValue: 'two-col',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      heading: 'heading',
    },
    prepare({label, heading}) {
      return {
        title: heading || label || 'Text Section',
        subtitle: label ? `Label: ${label}` : undefined,
      }
    },
  },
})



