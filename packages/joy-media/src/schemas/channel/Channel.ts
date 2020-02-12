
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';
import { PublicationStatusType } from '../general/PublicationStatus';
import { CurationStatusType } from '../general/CurationStatus';

export const ChannelValidationSchema = Yup.object().shape({
  content: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.'),
  handle: Yup.string()
    .required('This field is required')
    .max(40, 'Text is too long. Maximum length is 40 chars.'),
  title: Yup.string()
    .max(100, 'Text is too long. Maximum length is 100 chars.'),
  description: Yup.string()
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  avatar: Yup.string()
    .max(1000, 'Text is too long. Maximum length is 1000 chars.'),
  banner: Yup.string()
    .max(1000, 'Text is too long. Maximum length is 1000 chars.')
});

export type ChannelFormValues = {
  verified: boolean
  content: string
  handle: string
  title: string
  description: string
  avatar: string
  banner: string
  publicationStatus: number
  curationStatus: number
};

export type ChannelType = {
  id: number
  verified?: boolean
  content: string
  handle: string
  title?: string
  description?: string
  avatar?: string
  banner?: string
  publicationStatus: PublicationStatusType
  curationStatus?: CurationStatusType
};

export class ChannelCodec extends EntityCodec<ChannelType> { }

export function ChannelToFormValues(entity?: ChannelType): ChannelFormValues {
  return {
    verified: entity && entity.verified || false,
    content: entity && entity.content || '',
    handle: entity && entity.handle || '',
    title: entity && entity.title || '',
    description: entity && entity.description || '',
    avatar: entity && entity.avatar || '',
    banner: entity && entity.banner || '',
    publicationStatus: entity && entity.publicationStatus.id || 0,
    curationStatus: entity && entity.curationStatus?.id || 0
  }
}

export type ChannelPropId =
  'verified' |
  'content' |
  'handle' |
  'title' |
  'description' |
  'avatar' |
  'banner' |
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
  verified: {
    "id": "verified",
    "name": "Verified",
    "description": "Indicates whether the channel is verified by a content curator.",
    "type": "Bool"
  },
  content: {
    "id": "content",
    "name": "Content",
    "description": "The type of channel.",
    "type": "Text",
    "required": true,
    "maxTextLength": 100
  },
  handle: {
    "id": "handle",
    "name": "Handle",
    "description": "Unique URL handle of channel.",
    "type": "Text",
    "required": true,
    "maxTextLength": 40
  },
  title: {
    "id": "title",
    "name": "Title",
    "description": "Human readable title of channel.",
    "type": "Text",
    "maxTextLength": 100
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Human readable description of channel purpose and scope.",
    "type": "Text",
    "maxTextLength": 4000
  },
  avatar: {
    "id": "avatar",
    "name": "Avatar",
    "description": "URL to avatar (logo) iamge: NOTE: Should be an https link to a square image.",
    "type": "Text",
    "maxTextLength": 1000
  },
  banner: {
    "id": "banner",
    "name": "Banner",
    "description": "URL to banner image: NOTE: Should be an https link to a rectangular image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "type": "Text",
    "maxTextLength": 1000
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
    "description": "The curation status of the channel.",
    "type": "Internal",
    "classId": "Curation Status"
  }
};
