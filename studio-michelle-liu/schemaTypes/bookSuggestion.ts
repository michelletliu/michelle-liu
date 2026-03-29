import {defineField, defineType} from 'sanity'

export const bookSuggestion = defineType({
  name: 'bookSuggestion',
  title: 'Book Suggestion',
  type: 'document',
  fields: [
    defineField({
      name: 'bookTitle',
      title: 'Book Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'New', value: 'new'},
          {title: 'Reviewed', value: 'reviewed'},
          {title: 'Added to Library', value: 'added'},
          {title: 'Dismissed', value: 'dismissed'},
        ],
      },
      initialValue: 'new',
    }),
    defineField({
      name: 'senderNote',
      title: 'Sender Note',
      type: 'string',
      description: 'Name or note left by the person who suggested the book',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      description: 'Any notes about this suggestion',
    }),
  ],
  preview: {
    select: {
      title: 'bookTitle',
      subtitle: 'submittedAt',
      status: 'status',
    },
    prepare({title, subtitle, status}) {
      const statusEmoji = {
        new: '🆕',
        reviewed: '👀',
        added: '✅',
        dismissed: '❌',
      }[status as string] || ''
      
      return {
        title: `${statusEmoji} ${title}`,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
      }
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [{field: 'submittedAt', direction: 'desc'}],
    },
  ],
})
