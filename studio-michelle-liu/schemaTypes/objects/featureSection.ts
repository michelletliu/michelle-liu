import {defineType, defineField} from 'sanity'
import {ComponentIcon} from '@sanity/icons'

export const featureSection = defineType({
  name: 'featureSection',
  title: 'Feature Section (with Background)',
  type: 'object',
  icon: ComponentIcon,
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
      description: 'Hex color for background (e.g., "#f3f4f6" for gray, "#eff6ff" for blue)',
      initialValue: '#f9fafb',
    }),
    defineField({
      name: 'verticalPadding',
      title: 'Vertical Padding',
      type: 'string',
      description: 'Control the vertical padding inside the section',
      options: {
        list: [
          {title: 'Normal (16)', value: 'normal'},
          {title: 'Small (10)', value: 'small'},
          {title: 'Large (20)', value: 'large'},
        ],
        layout: 'radio',
      },
      initialValue: 'normal',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Side by Side (Text | Media)', value: 'side-by-side'},
          {title: 'Stacked (Text above Media)', value: 'stacked'},
        ],
        layout: 'radio',
      },
      initialValue: 'side-by-side',
    }),
    defineField({
      name: 'mediaPosition',
      title: 'Media Position',
      type: 'string',
      description: 'For side-by-side layout, choose media position',
      options: {
        list: [
          {title: 'Media on Right (Text | Media)', value: 'right'},
          {title: 'Media on Left (Media | Text)', value: 'left'},
        ],
        layout: 'radio',
      },
      initialValue: 'right',
      hidden: ({parent}) => parent?.layout !== 'side-by-side',
    }),
    defineField({
      name: 'sectionNumber',
      title: 'Section Number',
      type: 'string',
      description: 'Optional number label (e.g., "01", "02")',
    }),
    defineField({
      name: 'sectionLabel',
      title: 'Section Label',
      type: 'string',
      description: 'Small label next to number (e.g., "Problem Space", "Solution")',
    }),
    defineField({
      name: 'problemLabel',
      title: 'Problem/Feature Label',
      type: 'string',
      description: 'Label above heading (e.g., "PROBLEM 01", "FEATURE 01")',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Main heading',
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
      description: 'Color for the highlighted text (e.g., "#3b82f6" for blue, "#ef4444" for red)',
      initialValue: '#3b82f6',
    }),
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      description: 'Choose between image or video',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Video (Mux)', value: 'video'},
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      description: 'Upload an image',
      options: {
        hotspot: true,
      },
      hidden: ({parent}) => parent?.mediaType === 'video',
    }),
    defineField({
      name: 'externalImageUrl',
      title: 'External Image URL',
      type: 'string',
      description: 'Alternative: Use a URL or path instead of uploading',
      hidden: ({parent}) => parent?.mediaType === 'video',
    }),
    defineField({
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      type: 'string',
      description: 'Mux video playback ID',
      hidden: ({parent}) => parent?.mediaType !== 'video',
    }),
    defineField({
      name: 'imageAlt',
      title: 'Alt Text / Video Title',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
      description: 'Body text below the image',
    }),
    defineField({
      name: 'descriptionHighlightedText',
      title: 'Description Highlighted Text',
      type: 'string',
      description: 'Text in description to highlight (matches first occurrence)',
    }),
    defineField({
      name: 'descriptionHighlightColor',
      title: 'Description Highlight Color',
      type: 'string',
      initialValue: '#3b82f6',
    }),
  ],
  preview: {
    select: {
      heading: 'heading',
      label: 'sectionLabel',
      media: 'image',
    },
    prepare({heading, label, media}) {
      return {
        title: heading || 'Feature Section',
        subtitle: label || 'With background',
        media,
      }
    },
  },
})
