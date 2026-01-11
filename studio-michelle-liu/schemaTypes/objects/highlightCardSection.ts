import {defineType, defineField, defineArrayMember} from 'sanity'
import {ComponentIcon} from '@sanity/icons'

export const highlightCardSection = defineType({
  name: 'highlightCardSection',
  title: 'Highlight Cards',
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
      description: 'Background color for the section (default: transparent)',
      type: 'string',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: '2 Columns', value: '2-col'},
          {title: '3 Columns', value: '3-col'},
          {title: 'Stacked (1 Column)', value: 'stacked'},
        ],
        layout: 'radio',
      },
      initialValue: '2-col',
    }),
    defineField({
      name: 'cardStyle',
      title: 'Card Style',
      type: 'string',
      options: {
        list: [
          {title: 'With Background', value: 'with-bg'},
          {title: 'No Background (Clean)', value: 'no-bg'},
          {title: 'With Border', value: 'with-border'},
        ],
        layout: 'radio',
      },
      initialValue: 'with-bg',
    }),
    defineField({
      name: 'showDividers',
      title: 'Show Lines Between Cards',
      type: 'boolean',
      description: 'Add dividing lines between cards',
      initialValue: false,
    }),
    defineField({
      name: 'cards',
      title: 'Highlight Cards',
      description: 'Add cards with headline, image, and description',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'highlightCard',
          title: 'Highlight Card',
          fields: [
            defineField({
              name: 'cardLayout',
              title: 'Card Layout',
              type: 'string',
              options: {
                list: [
                  {title: 'Stacked (image above text)', value: 'stacked'},
                  {title: 'Side by Side (image next to text)', value: 'side-by-side'},
                ],
                layout: 'radio',
              },
              initialValue: 'stacked',
            }),
            defineField({
              name: 'imagePosition',
              title: 'Image Position (for side-by-side)',
              type: 'string',
              options: {
                list: [
                  {title: 'Left', value: 'left'},
                  {title: 'Right', value: 'right'},
                ],
                layout: 'radio',
              },
              initialValue: 'left',
              hidden: ({parent}) => parent?.cardLayout !== 'side-by-side',
            }),
            defineField({
              name: 'headline',
              title: 'Headline',
              type: 'text',
              rows: 3,
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'highlightedText',
              title: 'Highlighted Text',
              type: 'string',
              description: 'Text within the headline to highlight',
            }),
            defineField({
              name: 'highlightColor',
              title: 'Highlight Color',
              type: 'string',
              description: 'Color for highlighted text (default: #3b82f6)',
              initialValue: '#3b82f6',
            }),
            defineField({
              name: 'headlineColor',
              title: 'Headline Color',
              description: 'Color for the headline (default: black)',
              type: 'string',
            }),
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'externalImageUrl',
              title: 'External Image URL',
              description: 'Or use an external image URL instead',
              type: 'url',
            }),
            defineField({
              name: 'imageAspectRatio',
              title: 'Image Aspect Ratio',
              type: 'string',
              options: {
                list: [
                  {title: 'Square (1:1)', value: 'square'},
                  {title: 'Landscape (16:9)', value: 'landscape'},
                  {title: 'Portrait (3:4)', value: 'portrait'},
                  {title: 'Auto (natural)', value: 'auto'},
                ],
                layout: 'radio',
              },
              initialValue: 'landscape',
            }),
            defineField({
              name: 'imageRoundedCorners',
              title: 'Image Rounded Corners',
              type: 'string',
              description: 'Border radius for the image',
              options: {
                list: [
                  {title: 'None (Square)', value: 'none'},
                  {title: 'Small', value: 'small'},
                  {title: 'Medium', value: 'medium'},
                  {title: 'Large', value: 'large'},
                  {title: 'Full (Circle)', value: 'full'},
                ],
                layout: 'radio',
              },
              initialValue: 'medium',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    decorators: [
                      { title: 'Strong', value: 'strong' },
                      { title: 'Emphasis', value: 'em' },
                      { title: 'Underline', value: 'underline' },
                    ],
                  },
                },
              ],
            }),
            defineField({
              name: 'cardBackgroundColor',
              title: 'Card Background Color',
              description: 'Override background color for this specific card',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'headline',
              media: 'image',
            },
            prepare({title, media}) {
              return {
                title: title || 'Untitled Card',
                subtitle: 'Highlight Card',
                media,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      cards: 'cards',
      layout: 'layout',
    },
    prepare({cards, layout}) {
      const count = cards?.length || 0
      return {
        title: 'Highlight Cards',
        subtitle: `${count} card${count === 1 ? '' : 's'} • ${layout || '2-col'}`,
      }
    },
  },
})
