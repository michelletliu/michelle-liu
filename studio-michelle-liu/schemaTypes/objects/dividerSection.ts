import {defineType} from 'sanity'
import {RemoveIcon} from '@sanity/icons'

export const dividerSection = defineType({
  name: 'dividerSection',
  title: 'Divider Line',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    // No fields needed - this is just a visual separator
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
