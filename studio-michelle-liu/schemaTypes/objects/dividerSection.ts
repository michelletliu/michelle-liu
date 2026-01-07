import {defineType, defineField} from 'sanity'
import {RemoveIcon} from '@sanity/icons'

export const dividerSection = defineType({
  name: 'dividerSection',
  title: 'Divider Line',
  type: 'object',
  icon: RemoveIcon,
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
    // Adding a hidden field to satisfy Sanity's requirement for at least one field
    {
      name: 'style',
      title: 'Style',
      type: 'string',
      hidden: true,
      initialValue: 'default',
    },
  ],
  preview: {
    prepare() {
      return {
        title: 'Divider Line',
        subtitle: 'Horizontal separator',
      }
    },
  },
})
