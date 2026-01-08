import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const phoneVideoSection = defineType({
  name: 'phoneVideoSection',
  title: 'Phone Video Section',
  type: 'object',
  icon: PlayIcon,
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
      description: 'Hex color for the video background square (e.g., "#000000" for black, "#1f2937" for dark gray)',
      initialValue: '#000000',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Video Left, Text Right', value: 'video-left'},
          {title: 'Video Right, Text Left', value: 'video-right'},
        ],
        layout: 'radio',
      },
      initialValue: 'video-left',
    }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          {title: 'Video (Mux)', value: 'video'},
          {title: 'GIF/Image', value: 'gif'},
        ],
        layout: 'radio',
      },
      initialValue: 'video',
    }),
    defineField({
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      type: 'string',
      description: 'Mux video playback ID for the phone video',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'gifImage',
      title: 'GIF/Image',
      type: 'image',
      description: 'Upload a GIF or image',
      options: {
        hotspot: true,
      },
      hidden: ({parent}) => parent?.mediaType !== 'gif',
    }),
    defineField({
      name: 'externalGifUrl',
      title: 'External GIF/Image URL',
      type: 'string',
      description: 'Alternative: Use a URL or path instead of uploading',
      hidden: ({parent}) => parent?.mediaType !== 'gif',
    }),
    defineField({
      name: 'emoji',
      title: 'Emoji/Icon',
      type: 'string',
      description: 'Optional emoji or icon (e.g., "🎮")',
    }),
    defineField({
      name: 'sectionNumber',
      title: 'Section Number',
      type: 'string',
      description: 'Optional number (e.g., "01")',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'text',
      rows: 3,
      description: 'Main heading text (line breaks supported)',
    }),
    defineField({
      name: 'highlightedText',
      title: 'Highlighted Text',
      type: 'string',
      description: 'Text within the heading to highlight with a custom color',
    }),
    defineField({
      name: 'highlightColor',
      title: 'Highlight Color',
      type: 'string',
      description: 'Color for the highlighted text (e.g., "#3b82f6" for blue)',
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'text',
      rows: 3,
      description: 'Optional subtitle text (line breaks supported)',
    }),
    defineField({
      name: 'bulletPoints',
      title: 'Bullet Points',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Optional list of bullet points',
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      emoji: 'emoji',
    },
    prepare({heading, emoji}) {
      return {
        title: heading || 'Phone Video Section',
        subtitle: emoji ? `${emoji} Phone video showcase` : 'Phone video showcase',
      }
    },
  },
})
