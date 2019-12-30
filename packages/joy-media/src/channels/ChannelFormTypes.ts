
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const ChannelValidationSchema = Yup.object().shape({
  content: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  channelName: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  thumbnail: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  cover: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  description: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.')
});

export type ChannelType = {
  content: string
  channelName: string
  thumbnail: string
  cover: string
  description: string
  publicationStatus: any
  curationStatus?: any
};

export type ChannelPropId =
  'content' |
  'channelName' |
  'thumbnail' |
  'cover' |
  'description' |
  'publicationStatus' |
  'curationStatus'
  ;

export type ChannelGenericProp = {
  id: ChannelPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type ChannelClassType = {
  [id in ChannelPropId]: ChannelGenericProp
};

export const ChannelClass: ChannelClassType = {
  content: {
    "id": "content",
    "name": "Content",
    "description": "The type of channel.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  channelName: {
    "id": "channelName",
    "name": "Channel name",
    "description": "Unique human readble channel name.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  thumbnail: {
    "id": "thumbnail",
    "name": "Thumbnail",
    "description": "URL to channel thumbnail: NOTE: Should be an https link to a square image.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  cover: {
    "id": "cover",
    "name": "Cover",
    "description": "URL to channel cover art: NOTE: Should be an https link to a square image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Human readable description of channel purpose and scope.",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the channel.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "id": "curationStatus",
    "name": "Curation Status",
    "description": "The publication status of the channel.",
    "type": "Internal",
    "classId": "Curation Status"
  }
};
