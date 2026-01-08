import {defineType, defineField} from 'sanity'
import {LockIcon} from '@sanity/icons'

export const protectedSection = defineType({
  name: 'protectedSection',
  title: 'Protected / Confidential Section',
  type: 'object',
  icon: LockIcon,
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
      initialValue: 'locked',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Confidential',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 2,
      initialValue: 'Interested? Please email me!',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      validation: (rule) => rule.email(),
    }),
    defineField({
      name: 'showPasswordProtection',
      title: 'Enable Password Protection',
      description: 'If enabled, content below this section will require a password',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'password',
      title: 'Password',
      type: 'string',
      hidden: ({parent}) => !parent?.showPasswordProtection,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Protected Section',
        subtitle: '🔒 Confidential content',
      }
    },
  },
})



