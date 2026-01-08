import {defineType, defineField} from 'sanity'
import {PlayIcon} from '@sanity/icons'

export const videoSection = defineType({
  name: 'videoSection',
  title: 'Video Section',
  type: 'object',
  icon: PlayIcon,
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
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description: 'Optional background color for the section (e.g., "#f9fafb", "#ffffff")',
    }),
    defineField({
      name: 'size',
      title: 'Video Size',
      type: 'string',
      options: {
        list: [
          {title: 'Full Width', value: 'full'},
          {title: 'Medium', value: 'medium'},
        ],
        layout: 'radio',
      },
      initialValue: 'full',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'videoType',
      title: 'Video Type',
      type: 'string',
      options: {
        list: [
          {title: 'Mux', value: 'mux'},
          {title: 'YouTube', value: 'youtube'},
          {title: 'Vimeo', value: 'vimeo'},
        ],
        layout: 'radio',
      },
      initialValue: 'mux',
    }),
    defineField({
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      type: 'string',
      hidden: ({parent}) => parent?.videoType !== 'mux',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      hidden: ({parent}) => parent?.videoType !== 'youtube',
    }),
    defineField({
      name: 'vimeoUrl',
      title: 'Vimeo URL',
      type: 'url',
      hidden: ({parent}) => parent?.videoType !== 'vimeo',
    }),
    defineField({
      name: 'posterImage',
      title: 'Poster Image',
      description: 'Thumbnail shown before video plays',
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
      name: 'autoplay',
      title: 'Autoplay (muted)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      videoType: 'videoType',
      media: 'posterImage',
    },
    prepare({title, videoType, media}) {
      return {
        title: title || 'Video Section',
        subtitle: videoType ? `${videoType} video` : 'Video',
        media,
      }
    },
  },
})



