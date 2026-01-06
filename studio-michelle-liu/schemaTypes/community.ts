import {defineType, defineField, defineArrayMember} from 'sanity'
import {UsersIcon} from '@sanity/icons'

/**
 * Community involvement items for the About page.
 * Each item shows an organization with a photo collage.
 */
export const community = defineType({
  name: 'community',
  title: 'Community',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Organization/Community Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sidebarName',
      title: 'Sidebar Name',
      type: 'string',
      description: 'Short name to display in the sidebar navigation (e.g., "UCLA PRODUCT SPACE")',
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram URL',
      type: 'url',
      description: 'Link to the community/organization Instagram page',
      validation: (rule) =>
        rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'photos',
      title: 'Photo Collage',
      description: 'Add up to 4 photos for the collage',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'collagePhoto',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
            }),
            defineField({
              name: 'rotation',
              title: 'Rotation (degrees)',
              description: 'Positive = clockwise, Negative = counter-clockwise',
              type: 'number',
              initialValue: 0,
            }),
            defineField({
              name: 'orientation',
              title: 'Image Orientation',
              type: 'string',
              options: {
                list: [
                  {title: 'Horizontal (Landscape)', value: 'horizontal'},
                  {title: 'Vertical (Portrait)', value: 'vertical'},
                ],
                layout: 'radio',
              },
              initialValue: 'horizontal',
            }),
            defineField({
              name: 'yOffset',
              title: 'Y Offset',
              description: 'Move card up (negative) or down (positive)',
              type: 'string',
              options: {
                list: [
                  {title: 'Up 16', value: '-16'},
                  {title: 'Up 12', value: '-12'},
                  {title: 'Up 10', value: '-10'},
                  {title: 'Up 8', value: '-8'},
                  {title: 'Up 6', value: '-6'},
                  {title: 'Up 4', value: '-4'},
                  {title: 'Up 2', value: '-2'},
                  {title: 'None', value: '0'},
                  {title: 'Down 2', value: '2'},
                  {title: 'Down 4', value: '4'},
                  {title: 'Down 6', value: '6'},
                  {title: 'Down 8', value: '8'},
                  {title: 'Down 10', value: '10'},
                  {title: 'Down 12', value: '12'},
                  {title: 'Down 16', value: '16'},
                ],
                layout: 'dropdown',
              },
              initialValue: '0',
            }),
            defineField({
              name: 'xOffset',
              title: 'X Offset',
              description: 'Move card left (negative) or right (positive)',
              type: 'string',
              options: {
                list: [
                  {title: 'Left 16', value: '-16'},
                  {title: 'Left 12', value: '-12'},
                  {title: 'Left 10', value: '-10'},
                  {title: 'Left 8', value: '-8'},
                  {title: 'Left 6', value: '-6'},
                  {title: 'Left 4', value: '-4'},
                  {title: 'Left 2', value: '-2'},
                  {title: 'None', value: '0'},
                  {title: 'Right 2', value: '2'},
                  {title: 'Right 4', value: '4'},
                  {title: 'Right 6', value: '6'},
                  {title: 'Right 8', value: '8'},
                  {title: 'Right 10', value: '10'},
                  {title: 'Right 12', value: '12'},
                  {title: 'Right 16', value: '16'},
                ],
                layout: 'dropdown',
              },
              initialValue: '0',
            }),
          ],
          preview: {
            select: {
              title: 'caption',
              media: 'image',
            },
          },
        }),
      ],
      validation: (rule) => rule.max(4),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
    defineField({
      name: 'isPublished',
      title: 'Published',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'logo',
    },
    prepare({title, media}) {
      return {
        title,
        subtitle: 'Community',
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
})


