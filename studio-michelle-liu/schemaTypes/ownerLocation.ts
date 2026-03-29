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
      description: 'Current city name (e.g. "Los Angeles")',
      validation: (Rule) => Rule.required(),
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
