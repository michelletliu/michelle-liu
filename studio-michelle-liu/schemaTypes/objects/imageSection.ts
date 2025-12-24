import {defineType, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons'

export const imageSection = defineType({
  name: 'imageSection',
  title: 'Image Section',
  type: 'object',
  icon: ImageIcon,
  fields: [
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
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'size',
      title: 'Size',
      type: 'string',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Large (with padding)', value: 'large'},
          {title: 'Medium', value: 'medium'},
        ],
        layout: 'radio',
      },
      initialValue: 'large',
    }),
    defineField({
      name: 'rounded',
      title: 'Rounded Corners',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      media: 'image',
      caption: 'caption',
      size: 'size',
    },
    prepare({media, caption, size}) {
      return {
        title: 'Image Section',
        subtitle: caption || size || 'Large image',
        media,
      }
    },
  },
})

