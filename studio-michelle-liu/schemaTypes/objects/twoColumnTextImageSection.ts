import {defineType, defineField} from 'sanity'
import {ImagesIcon} from '@sanity/icons'

export const twoColumnTextImageSection = defineType({
  name: 'twoColumnTextImageSection',
  title: 'Two Column Text & Image Section',
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
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 2,
      description: 'Main heading text',
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
      initialValue: '#EC4899',
    }),
    defineField({
      name: 'textContent',
      title: 'Text Content',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Text content on the left side',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Background color for the section',
      initialValue: '#F3F4F6',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Image to overlay on the background',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'imageUrl',
      title: 'External Image URL',
      type: 'url',
      description: 'Or use an external image URL',
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      media: 'image',
    },
    prepare({heading, media}) {
      return {
        title: heading || 'Two Column Text & Image',
        subtitle: 'Text + Image Section',
        media,
      }
    },
  },
})
