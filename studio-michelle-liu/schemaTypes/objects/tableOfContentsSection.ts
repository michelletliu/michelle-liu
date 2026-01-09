import {defineType, defineField, defineArrayMember} from 'sanity'
import {MenuIcon} from '@sanity/icons'

export const tableOfContentsSection = defineType({
  name: 'tableOfContentsSection',
  title: 'Table of Contents',
  type: 'object',
  icon: MenuIcon,
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
      name: 'sectionNumber',
      title: 'Section Number',
      description: 'e.g., "i." or "01"',
      type: 'string',
    }),
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      description: 'e.g., "The Process"',
      type: 'string',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      description: 'e.g., "Adobe x UCLA Product Space"',
      type: 'string',
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      description: 'Background color for the section (default: light pink #fef2f2)',
      type: 'string',
      initialValue: '#fef2f2',
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      description: 'Color for numbers and titles (default: pink #ec4899)',
      type: 'string',
      initialValue: '#ec4899',
    }),
    defineField({
      name: 'hintText',
      title: 'Hint Text',
      description: 'Hint text shown above the items (e.g., "Click on any image to skip to a section!")',
      type: 'string',
      initialValue: 'Click on any image to skip to a section!',
    }),
    defineField({
      name: 'items',
      title: 'TOC Items',
      description: 'Add table of contents items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tocItem',
          title: 'TOC Item',
          fields: [
            defineField({
              name: 'image',
              title: 'Icon/Image',
              description: 'Custom icon image for this item',
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
              name: 'number',
              title: 'Number',
              description: 'e.g., "01", "02"',
              type: 'string',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              description: 'e.g., "Project Overview"',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'targetSectionId',
              title: 'Target Section ID',
              description: 'ID of the section to scroll to when clicked (matches sectionTitleSection number)',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              number: 'number',
              media: 'image',
            },
            prepare({title, number, media}) {
              return {
                title: title || 'Untitled',
                subtitle: number || '',
                media,
              }
            },
          },
        }),
      ],
      validation: (rule) => rule.max(6),
    }),
  ],
  preview: {
    select: {
      sectionTitle: 'sectionTitle',
      items: 'items',
    },
    prepare({sectionTitle, items}) {
      const count = items?.length || 0
      return {
        title: sectionTitle || 'Table of Contents',
        subtitle: `${count} item${count === 1 ? '' : 's'}`,
      }
    },
  },
})
