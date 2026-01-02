import {defineType, defineField} from 'sanity'
import {TagIcon} from '@sanity/icons'

export const metadataItem = defineType({
  name: 'metadataItem',
  title: 'Metadata Item',
  type: 'object',
  icon: TagIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Value',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Add one or more values (e.g., multiple collaborator names)',
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'subValue',
      title: 'Sub Value (Italic)',
      type: 'string',
      description: 'Optional secondary text shown in italics (e.g., "via UCLA Product Space")',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      value: 'value',
      subValue: 'subValue',
    },
    prepare({label, value, subValue}) {
      const valueStr = Array.isArray(value) ? value.join(', ') : value
      const subtitle = subValue ? `${valueStr} (${subValue})` : valueStr
      return {
        title: label,
        subtitle,
      }
    },
  },
})



