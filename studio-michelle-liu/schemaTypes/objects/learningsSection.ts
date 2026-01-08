import {defineType, defineField} from 'sanity'
import {BulbOutlineIcon} from '@sanity/icons'

export const learningsSection = defineType({
  name: 'learningsSection',
  title: 'Learnings Section',
  type: 'object',
  icon: BulbOutlineIcon,
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
      type: 'string',
      description: 'Optional title for the learnings section',
    }),
    defineField({
      name: 'learnings',
      title: 'Learning Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'emoji',
              title: 'Emoji',
              type: 'string',
              description: 'Icon/emoji for this learning',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'Learning heading',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
              description: 'Learning description/explanation',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              emoji: 'emoji',
              description: 'description',
            },
            prepare({title, emoji, description}) {
              return {
                title: `${emoji || '📝'} ${title}`,
                subtitle: description,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'sectionTitle',
      learningsCount: 'learnings.length',
    },
    prepare({title, learningsCount}) {
      return {
        title: title || 'Learnings Section',
        subtitle: `${learningsCount || 0} learning items`,
      }
    },
  },
})
