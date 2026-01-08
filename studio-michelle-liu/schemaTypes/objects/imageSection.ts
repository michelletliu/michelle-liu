import {defineType, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons'

export const imageSection = defineType({
  name: 'imageSection',
  title: 'Image Section',
  type: 'object',
  icon: ImageIcon,
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
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Upload an image or use External Image URL below',
    }),
    defineField({
      name: 'externalImageUrl',
      title: 'External Image URL',
      type: 'string',
      description: 'Alternative: Use a URL or path (e.g., /roblox/image.png) instead of uploading',
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
          {title: 'Small', value: 'small'},
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



