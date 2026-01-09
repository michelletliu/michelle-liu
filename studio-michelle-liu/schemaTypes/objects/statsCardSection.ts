import {defineType, defineField, defineArrayMember} from 'sanity'
import {ActivityIcon} from '@sanity/icons'

export const statsCardSection = defineType({
  name: 'statsCardSection',
  title: 'Stats Cards',
  type: 'object',
  icon: ActivityIcon,
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
      name: 'sectionTitle',
      title: 'Section Title',
      description: 'e.g., "By the numbers:"',
      type: 'string',
    }),
    defineField({
      name: 'titleColor',
      title: 'Title Color',
      description: 'Color for the section title (default: gray #9ca3af)',
      type: 'string',
      initialValue: '#9ca3af',
    }),
    defineField({
      name: 'showDividerLine',
      title: 'Show Divider Line',
      description: 'Show a horizontal line after the title',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'statColor',
      title: 'Stat Number Color',
      description: 'Color for all stat numbers (default: pink #ec4899)',
      type: 'string',
      initialValue: '#ec4899',
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: '3 Columns', value: '3-col'},
          {title: '4 Columns', value: '4-col'},
          {title: '2 Columns', value: '2-col'},
        ],
        layout: 'radio',
      },
      initialValue: '3-col',
    }),
    defineField({
      name: 'cards',
      title: 'Stat Cards',
      description: 'Add stat cards with number and description',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'statCard',
          title: 'Stat Card',
          fields: [
            defineField({
              name: 'statValue',
              title: 'Stat Value',
              description: 'The main number/stat (e.g., "29", "46%", "$1.2M")',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'statColorOverride',
              title: 'Stat Color Override',
              description: 'Override the stat color for this specific card',
              type: 'string',
            }),
            defineField({
              name: 'description',
              title: 'Description',
              description: 'Description text (use **text** for bold)',
              type: 'text',
              rows: 2,
            }),
          ],
          preview: {
            select: {
              statValue: 'statValue',
              description: 'description',
            },
            prepare({statValue, description}) {
              return {
                title: statValue || 'No value',
                subtitle: description || '',
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      cards: 'cards',
    },
    prepare({sectionTitle, cards}) {
      const count = cards?.length || 0
      return {
        title: sectionTitle || 'Stats Cards',
        subtitle: `${count} stat${count === 1 ? '' : 's'}`,
      }
    },
  },
})
