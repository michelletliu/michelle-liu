import {defineType, defineField} from 'sanity'
import {ImageIcon} from '@sanity/icons'

export const overlayImageSection = defineType({
  name: 'overlayImageSection',
  title: 'Image with Overlay',
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
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Optional background color for the section (e.g., "#f9fafb", "#ffffff")',
    }),
    defineField({
      name: 'baseImage',
      title: 'Base Image',
      type: 'image',
      description: 'The main background image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'externalBaseImageUrl',
      title: 'External Base Image URL',
      type: 'string',
      description: 'Alternative: Use a URL or path instead of uploading',
    }),
    defineField({
      name: 'overlayImage',
      title: 'Overlay Image',
      type: 'image',
      description: 'Image to overlay on top (e.g., cursor blob)',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'externalOverlayImageUrl',
      title: 'External Overlay Image URL',
      type: 'string',
      description: 'Alternative: Use a URL or path for overlay',
    }),
    defineField({
      name: 'overlayPosition',
      title: 'Overlay Position',
      type: 'object',
      fields: [
        {
          name: 'x',
          title: 'X Position (%)',
          type: 'number',
          description: 'Horizontal position (0-100)',
          validation: (rule) => rule.min(0).max(100),
          initialValue: 50,
        },
        {
          name: 'y',
          title: 'Y Position (%)',
          type: 'number',
          description: 'Vertical position (0-100)',
          validation: (rule) => rule.min(0).max(100),
          initialValue: 50,
        },
      ],
    }),
    defineField({
      name: 'overlaySize',
      title: 'Overlay Size',
      type: 'string',
      options: {
        list: [
          {title: 'Small', value: 'small'},
          {title: 'Medium', value: 'medium'},
          {title: 'Large', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'size',
      title: 'Image Size',
      type: 'string',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Large', value: 'large'},
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
      media: 'baseImage',
    },
    prepare({media}) {
      return {
        title: 'Image with Overlay',
        subtitle: 'Base image with overlay element',
        media,
      }
    },
  },
})
