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
      description: 'Hex color for the number (default: blue-400 #60a5fa)',
      initialValue: '#60a5fa',
    }),
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string',
      description: 'Title text (e.g., "Problem Space", "Solution")',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sidebarLabel',
      title: 'Sidebar Label',
      description:
        'Short label for the case study left nav when this project has no TOC cards. Falls back to Section Title if empty.',
      type: 'string',
      validation: (rule) => rule.max(40),
      hidden: ({parent}) => Boolean(parent?.hideFromSidebar),
    }),
    defineField({
      name: 'hideFromSidebar',
      title: 'Hide from Sidebar Nav',
      type: 'boolean',
      description:
        'Hide this section from the case study left nav. The section still appears on the page.',
      initialValue: false,
    }),
    defineField({
      name: 'titleColor',
      title: 'Title Color',
      type: 'string',
      description: 'Hex color for the title (default: blue-600 #2563eb)',
      initialValue: '#2563eb',
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
      hideFromSidebar: 'hideFromSidebar',
    },
    prepare({number, title, hideFromSidebar}) {
      return {
        title: `${number ? number + ' ' : ''}${title || 'Section Title'}`,
        subtitle: hideFromSidebar ? 'Section Title · hidden from nav' : 'Section Title',
      }
    },
  },
})
