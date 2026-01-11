import {defineType, defineField} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const twoColumnImageSection = defineType({
  name: 'twoColumnImageSection',
  title: 'Two Column Image Section',
  type: 'object',
  icon: ImagesIcon,
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
      description: 'Hex color for background (e.g., "#f3f4f6" for gray)',
      initialValue: '#ffffff',
    }),
    defineField({
      name: 'label',
      title: 'Section Label',
      type: 'string',
      description: 'Small label above heading (e.g., "COMPETITIVE AUDIT")',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 3,
      description: 'Main heading text (supports line breaks)',
    }),
    defineField({
      name: 'highlightedText',
      title: 'Highlighted Text',
      type: 'string',
      description: 'Text within the heading to highlight',
    }),
    defineField({
      name: 'highlightColor',
      title: 'Highlight Color',
      type: 'string',
      description: 'Color for highlighted text',
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Text content below heading',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      description: 'Choose which side the text content appears',
      options: {
        list: [
          {title: 'Text on Left, Large Image on Right', value: 'text-left'},
          {title: 'Large Image on Left, Text on Right', value: 'text-right'},
          {title: 'Text Between Two Images (3 columns)', value: 'three-column'},
          {title: 'Two Images Only (no text)', value: 'two-images'},
        ],
        layout: 'radio',
      },
      initialValue: 'text-left',
    }),
    defineField({
      name: 'leftImageSize',
      title: 'Left Image Width',
      type: 'string',
      description: 'Control the size of the left image',
      options: {
        list: [
          {title: 'Small (20%)', value: 'small'},
          {title: 'Medium (40%)', value: 'medium'},
          {title: 'Large (60%)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    }),
    defineField({
      name: 'rightImageSize',
      title: 'Right Image Width',
      type: 'string',
      description: 'Control the size of the right image',
      options: {
        list: [
          {title: 'Small (20%)', value: 'small'},
          {title: 'Medium (40%)', value: 'medium'},
          {title: 'Large (60%)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'large',
    }),
    defineField({
      name: 'leftImage',
      title: 'Left Image',
      type: 'image',
      description: 'Left side image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'leftImageUrl',
      title: 'Left Image URL',
      type: 'string',
      description: 'Alternative: Use external URL for left image',
    }),
    defineField({
      name: 'leftImageCaption',
      title: 'Left Image Caption',
      type: 'string',
      description: 'Optional caption for the left image',
    }),
    defineField({
      name: 'rightImage',
      title: 'Right Image',
      type: 'image',
      description: 'Right side image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'rightImageUrl',
      title: 'Right Image URL',
      type: 'string',
      description: 'Alternative: Use external URL for right image',
    }),
    defineField({
      name: 'rightImageCaption',
      title: 'Right Image Caption',
      type: 'string',
      description: 'Optional caption for the right image',
    }),
    defineField({
      name: 'imageGap',
      title: 'Gap Between Images',
      type: 'string',
      description: 'Space between the two images',
      options: {
        list: [
          {title: 'Small (3rem / 48px)', value: 'small'},
          {title: 'Medium (4rem / 64px)', value: 'medium'},
          {title: 'Large (5rem / 80px)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'normal',
    }),
    defineField({
      name: 'rounded',
      title: 'Rounded Corners',
      type: 'boolean',
      description: 'Apply rounded corners to images',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      label: 'label',
      leftImage: 'leftImage',
    },
    prepare({heading, label, leftImage}) {
      return {
        title: heading || 'Two Column Image Section',
        subtitle: label || 'Side-by-side images',
        media: leftImage,
      }
    },
  },
})
