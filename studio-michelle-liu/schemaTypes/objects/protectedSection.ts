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
      description:
        'If enabled, content below this section will require a password. ' +
        'The actual password is stored as an environment variable (PASSWORD_<COMPANY>) — not in Sanity.',
      type: 'boolean',
      initialValue: false,
    }),
    // NOTE: The `password` field has been removed. Passwords are now stored
    // exclusively as environment variables (PASSWORD_<COMPANY>) and verified
    // server-side via /api/password. This prevents leaking credentials through
    // the publicly-readable Sanity dataset.
    defineField({
      name: 'unlockTargetSectionId',
      title: 'Section To Expand To After Unlock',
      description:
        'Optional. Enter a target section number, section _key, or heading/title text to scroll to after correct password (e.g. "03" or "Chat Content Composer").',
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



