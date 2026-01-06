import {defineType, defineField, defineArrayMember} from 'sanity'
import {InlineIcon} from '@sanity/icons'

export const projectCardSection = defineType({
  name: 'projectCardSection',
  title: 'Project Cards',
  type: 'object',
  icon: InlineIcon,
  fields: [
    defineField({
      name: 'cards',
      title: 'Project Cards',
      description: 'Add featured project cards (max 4)',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'projectCard',
          title: 'Project Card',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              description: 'e.g., "PROJECT 01"',
              type: 'string',
            }),
            defineField({
              name: 'emoji',
              title: 'Emoji',
              description: 'Emoji to display before the title (e.g., 💬)',
              type: 'string',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'linkColor',
              title: 'Title Color',
              description: 'Color for the title text (default: black #111827)',
              type: 'string',
              initialValue: '#111827',
            }),
            defineField({
              name: 'image',
              title: 'Card Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
          ],
          preview: {
            select: {
              title: 'title',
              label: 'label',
              emoji: 'emoji',
              media: 'image',
            },
            prepare({title, label, emoji, media}) {
              return {
                title: `${emoji || ''} ${title || 'Untitled'}`,
                subtitle: label || '',
                media,
              }
            },
          },
        }),
      ],
      validation: (rule) => rule.max(4),
    }),
  ],
  preview: {
    select: {
      cards: 'cards',
    },
    prepare({cards}) {
      const count = cards?.length || 0
      return {
        title: 'Project Cards',
        subtitle: `${count} card${count === 1 ? '' : 's'}`,
      }
    },
  },
})
