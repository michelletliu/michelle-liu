import {defineType, defineField, defineArrayMember} from 'sanity'
import {StarIcon} from '@sanity/icons'

export const sideQuestSection = defineType({
  name: 'sideQuestSection',
  title: 'Side Quest / Feature Section',
  type: 'object',
  icon: StarIcon,
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
      name: 'label',
      title: 'Label',
      description: 'e.g., "Side Quest"',
      type: 'string',
      initialValue: 'Side Quest',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      description: 'e.g., "iContest Finalist"',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      description: 'e.g., "Top 10 teams out of 1,500+ interns"',
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
      name: 'teamLabel',
      title: 'Team Section Label',
      description: 'e.g., "Team"',
      type: 'string',
      initialValue: 'Team',
    }),
    defineField({
      name: 'teamMembers',
      title: 'Team Members',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'teamMember',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
            }),
            defineField({
              name: 'link',
              title: 'Link (optional)',
              description: 'LinkedIn or portfolio URL',
              type: 'url',
            }),
          ],
          preview: {
            select: {
              title: 'name',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{type: 'block'}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      label: 'label',
      media: 'image',
    },
    prepare({title, label, media}) {
      return {
        title: title || 'Side Quest Section',
        subtitle: label || '',
        media,
      }
    },
  },
})
