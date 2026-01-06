import {defineType, defineField, defineArrayMember} from 'sanity'
import {DocumentIcon} from '@sanity/icons'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  icon: DocumentIcon,
  fields: [
    // Basic Info
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'company',
      title: 'Company',
      type: 'string',
      options: {
        list: [
          {title: 'Apple', value: 'apple'},
          {title: 'Roblox', value: 'roblox'},
          {title: 'Adobe', value: 'adobe'},
          {title: 'NASA', value: 'nasa'},
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      description: 'Brief description shown in project cards',
      type: 'text',
      rows: 2,
    }),

    // Hero Section
    defineField({
      name: 'logo',
      title: 'Company Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'heroVideo',
      title: 'Hero Video (Mux)',
      description: 'Optional: Mux playback ID for hero video',
      type: 'string',
    }),

    // Metadata
    defineField({
      name: 'metadata',
      title: 'Project Metadata',
      type: 'array',
      of: [defineArrayMember({type: 'metadataItem'})],
    }),

    // Content Sections (Page Builder)
    defineField({
      name: 'content',
      title: 'Content Sections',
      description: 'Add and arrange content sections for this project',
      type: 'array',
      of: [
        defineArrayMember({type: 'missionSection'}),
        defineArrayMember({type: 'protectedSection'}),
        defineArrayMember({type: 'gallerySection'}),
        defineArrayMember({type: 'textSection'}),
        defineArrayMember({type: 'imageSection'}),
        defineArrayMember({type: 'videoSection'}),
        defineArrayMember({type: 'testimonialSection'}),
        defineArrayMember({type: 'projectCardSection'}),
        defineArrayMember({type: 'sideQuestSection'}),
        defineArrayMember({type: 'dividerSection'}),
      ],
    }),

    // Related Projects
    defineField({
      name: 'relatedProjects',
      title: 'Related Projects',
      description: 'Projects to show in "Also check out" section',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'project'}],
        }),
      ],
      validation: (rule) => rule.max(4),
    }),

    // Display Settings
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      company: 'company',
      media: 'logo',
    },
    prepare({title, company, media}) {
      return {
        title,
        subtitle: company ? company.charAt(0).toUpperCase() + company.slice(1) : '',
        media,
      }
    },
  },
})



