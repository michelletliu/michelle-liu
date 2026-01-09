import {defineType, defineField} from 'sanity'
import {BlockElementIcon} from '@sanity/icons'

export const sectionHeaderBar = defineType({
  name: 'sectionHeaderBar',
  title: 'Section Header Bar',
  type: 'object',
  icon: BlockElementIcon,
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
      description: 'Background color for the bar (default: light pink #fdf2f8)',
      type: 'string',
      initialValue: '#fdf2f8',
    }),
    defineField({
      name: 'textColor',
      title: 'Text Color',
      description: 'Color for all text (default: pink #ec4899)',
      type: 'string',
      initialValue: '#ec4899',
    }),
    // Column 1: Number
    defineField({
      name: 'number',
      title: 'Number (Left Column)',
      description: 'e.g., "01"',
      type: 'string',
    }),
    // Column 2: Title
    defineField({
      name: 'title',
      title: 'Title (Center Column)',
      description: 'e.g., "Project Overview"',
      type: 'string',
    }),
    // Column 3: Subtitle
    defineField({
      name: 'subtitle',
      title: 'Subtitle (Right Column)',
      description: 'e.g., "Adobe x UCLA Product Space"',
      type: 'string',
    }),
    // Optional images
    defineField({
      name: 'leftImage',
      title: 'Left Image (Optional)',
      description: 'Optional image to show on the left side',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'leftImageUrl',
      title: 'Left Image URL (Optional)',
      description: 'Or use an external image URL',
      type: 'url',
    }),
    defineField({
      name: 'rightImage',
      title: 'Right Image (Optional)',
      description: 'Optional image to show on the right side',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'rightImageUrl',
      title: 'Right Image URL (Optional)',
      description: 'Or use an external image URL',
      type: 'url',
    }),
    defineField({
      name: 'imageSize',
      title: 'Image Size',
      description: 'Size of the optional images',
      type: 'string',
      options: {
        list: [
          {title: 'Small (32px)', value: 'small'},
          {title: 'Medium (48px)', value: 'medium'},
          {title: 'Large (64px)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'verticalPadding',
      title: 'Vertical Padding',
      type: 'string',
      options: {
        list: [
          {title: 'Small', value: 'small'},
          {title: 'Normal', value: 'normal'},
          {title: 'Large', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'normal',
    }),
  ],
  preview: {
    select: {
      number: 'number',
      title: 'title',
      subtitle: 'subtitle',
    },
    prepare({number, title, subtitle}) {
      return {
        title: `${number || ''} ${title || 'Section Header Bar'}`.trim(),
        subtitle: subtitle || '',
      }
    },
  },
})
