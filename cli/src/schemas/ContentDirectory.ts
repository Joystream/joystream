import {
  ChannelInputParameters,
  VideoInputParameters,
  VideoCategoryInputParameters,
  ChannelCategoryInputParameters,
  JsonSchema,
} from '../Types'

export const VideoCategoryInputSchema: JsonSchema<VideoCategoryInputParameters> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
    },
  },
}

export const ChannelCategoryInputSchema: JsonSchema<ChannelCategoryInputParameters> = VideoCategoryInputSchema

export const ChannelInputSchema: JsonSchema<ChannelInputParameters> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'number' },
    description: { type: 'string' },
    isPublic: { type: 'boolean' },
    language: { type: 'string' },
    title: { type: 'string' },
    coverPhotoPath: { type: 'string' },
    avatarPhotoPath: { type: 'string' },
    rewardAccount: { type: ['string', 'null'] },
    collaborators: {
      type: ['array', 'null'],
      items: {
        type: 'integer',
        min: 0,
      },
    },
  },
}

export const VideoInputSchema: JsonSchema<VideoInputParameters> = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'number' },
    description: { type: 'string' },
    duration: { type: 'number' },
    hasMarketing: { type: 'boolean' },
    isExplicit: { type: 'boolean' },
    isPublic: { type: 'boolean' },
    language: { type: 'string' },
    license: {
      type: 'object',
      properties: {
        code: {
          type: 'number',
        },
        attribution: {
          type: 'string',
        },
        customText: {
          type: 'string',
        },
      },
    },
    mediaPixelHeight: { type: 'number' },
    mediaPixelWidth: { type: 'number' },
    mediaType: {
      type: 'object',
      properties: {
        codecName: {
          type: 'string',
        },
        container: {
          type: 'string',
        },
        mimeMediaType: {
          type: 'string',
        },
      },
    },
    persons: { type: 'array' },
    publishedBeforeJoystream: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
        },
        isPublished: {
          type: 'boolean',
        },
      },
    },
    thumbnailPhotoPath: { type: 'string' },
    title: { type: 'string' },
    videoPath: { type: 'string' },
  },
}
