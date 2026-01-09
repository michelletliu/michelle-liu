import {defineType, defineField, defineArrayMember} from 'sanity'
import {RocketIcon} from '@sanity/icons'

export const experimentProject = defineType({
  name: 'experimentProject',
  title: 'Experiment Project',
  type: 'document',
  icon: RocketIcon,
  fields: [
    defineField({
      name: 'projectId',
      title: 'Project ID',
      description: 'Unique identifier (e.g., "polaroid", "screentime", "library", "sketchbook")',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      description: 'The Mux playback ID for the video preview',
      type: 'string',
    }),
    defineField({
      name: 'xLink',
      title: 'X (Twitter) Link',
      description: 'Optional link to the X/Twitter post',
      type: 'url',
    }),
    defineField({
      name: 'tryItOutHref',
      title: 'Try It Out URL',
      description: 'The route path (e.g., "/polaroid", "/library")',
      type: 'string',
    }),
    defineField({
      name: 'toolCategories',
      title: 'Tool Categories',
      description: 'Categories of tools used in this project',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'toolCategory',
          title: 'Tool Category',
          fields: [
            defineField({
              name: 'label',
              title: 'Category Label',
              description: 'e.g., "Design", "Frontend", "Styling", "AI"',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'tools',
              title: 'Tools',
              type: 'array',
              of: [{type: 'string'}],
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              label: 'label',
              tools: 'tools',
            },
            prepare({label, tools}) {
              return {
                title: label,
                subtitle: tools?.join(', ') || '',
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      description: 'Lower numbers appear first',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      year: 'year',
      projectId: 'projectId',
    },
    prepare({title, year, projectId}) {
      return {
        title,
        subtitle: `${projectId} • ${year}`,
      }
    },
  },
})
