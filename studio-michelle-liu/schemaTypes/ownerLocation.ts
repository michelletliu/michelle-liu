import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'ownerLocation',
  title: 'Owner Location',
  type: 'document',
  fields: [
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      description:
        'City name only is fine (the iOS Shortcut sends this). The site appends the state, e.g. "Saratoga" → "Saratoga, CA".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'state',
      title: 'State',
      type: 'string',
      description:
        'Optional. The iOS Shortcut does not have to send this — the site infers it from the city.',
    }),
    defineField({
      name: 'timezone',
      title: 'Timezone',
      type: 'string',
      description: 'IANA timezone identifier (e.g. "America/Los_Angeles")',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      city: 'city',
      timezone: 'timezone',
    },
    prepare({city, timezone}) {
      return {
        title: city || 'No city set',
        subtitle: timezone,
      }
    },
  },
})
