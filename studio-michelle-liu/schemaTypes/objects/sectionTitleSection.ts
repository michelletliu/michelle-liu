import {defineType, defineField} from 'sanity'
import {BlockElementIcon} from '@sanity/icons'

export const sectionTitleSection = defineType({
  name: 'sectionTitleSection',
  title: 'Section Title',
  type: 'object',
  icon: BlockElementIcon,
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
      name: 'number',
      title: 'Section Number',
      type: 'string',
      description: 'Number label (e.g., "01", "02", "03")',
    }),
    defineField({
      name: 'numberColor',
      title: 'Number Color',
      type: 'string',
      description: 'Hex color for the number (e.g., "#7fa2ff")',
      initialValue: '#7fa2ff',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Title text (e.g., "Problem Space", "Solution")',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'titleColor',
      title: 'Title Color',
      type: 'string',
      description: 'Hex color for the title (e.g., "#2e5ede")',
      initialValue: '#2e5ede',
    }),
    defineField({
      name: 'lineColor',
      title: 'Line Color',
      type: 'string',
      description: 'Hex color for the horizontal line (e.g., "#e5e7eb")',
      initialValue: '#e5e7eb',
    }),
    defineField({
      name: 'showLine',
      title: 'Show Line',
      type: 'boolean',
      description: 'Toggle horizontal line below title',
      initialValue: true,
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text',
      rows: 2,
      description: 'Optional subtitle text below the horizontal line (gray text)',
    }),
    defineField({
      name: 'isSkipLinkStart',
      title: 'Skip Link Start',
      type: 'boolean',
      description: 'Mark this section as where "Skip to Final Designs" link appears',
      initialValue: false,
    }),
    defineField({
      name: 'isSkipLinkEnd',
      title: 'Skip Link End',
      type: 'boolean',
      description: 'Mark this section as the destination (where link disappears)',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      number: 'number',
      title: 'title',
    },
    prepare({number, title}) {
      return {
        title: `${number ? number + ' ' : ''}${title || 'Section Title'}`,
        subtitle: 'Section Title',
      }
    },
  },
})
