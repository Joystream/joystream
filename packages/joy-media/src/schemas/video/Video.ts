
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';
import { LanguageType } from '../general/Language';
import { VideoCategoryType } from './VideoCategory';
import { MediaObjectType } from '../general/MediaObject';
import { PublicationStatusType } from '../general/PublicationStatus';
import { CurationStatusType } from '../general/CurationStatus';
import { ContentLicenseType } from '../general/ContentLicense';

export const VideoValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  thumbnail: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  description: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type VideoFormValues = {
  title: string
  thumbnail: string
  description: string
  language: string
  firstReleased: string
  category: string
  link: string
  object: string
  publicationStatus: string
  curationStatus: string
  explicit: string
  license: string
  attribution: string
};

export type VideoType = {
  title: string
  thumbnail: string
  description: string
  language: LanguageType
  firstReleased: number
  category?: VideoCategoryType
  link?: string[]
  object?: MediaObjectType
  publicationStatus: PublicationStatusType
  curationStatus?: CurationStatusType
  explicit: boolean
  license: ContentLicenseType
  attribution?: string
};

export const VideoCodec = new EntityCodec<VideoType>();

export type VideoPropId =
  'title' |
  'thumbnail' |
  'description' |
  'language' |
  'firstReleased' |
  'category' |
  'link' |
  'object' |
  'publicationStatus' |
  'curationStatus' |
  'explicit' |
  'license' |
  'attribution'
  ;

export type VideoGenericProp = {
  id: VideoPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type VideoClassType = {
  [id in VideoPropId]: VideoGenericProp
};

export const VideoClass: VideoClassType = {
  title: {
    "id": "title",
    "name": "Title",
    "description": "The title of the video",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  thumbnail: {
    "id": "thumbnail",
    "name": "Thumbnail",
    "description": "URL to video thumbnail: NOTE: Should be an https link to an image of ratio 16:9, ideally 1280 pixels wide by 720 pixels tall, with a minimum width of 640 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Information about the video.",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  language: {
    "id": "language",
    "name": "Language",
    "description": "The main language used in the video.",
    "required": true,
    "type": "Internal",
    "classId": "Language"
  },
  firstReleased: {
    "id": "firstReleased",
    "name": "First Released",
    "description": "When the video was first released",
    "required": true,
    "type": "Int64"
  },
  category: {
    "id": "category",
    "name": "Category",
    "description": "The category of the video.",
    "type": "Internal",
    "classId": "Video Category"
  },
  link: {
    "id": "link",
    "name": "Link",
    "description": "A link to the creators page.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  object: {
    "id": "object",
    "name": "Object",
    "description": "The entityId of the object in the data directory.",
    "type": "Internal",
    "classId": "Media Object"
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the video.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "id": "curationStatus",
    "name": "Curation Status",
    "description": "The publication status of the video set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "id": "explicit",
    "name": "Explicit",
    "description": "Indicates whether the video contains explicit material.",
    "required": true,
    "type": "Bool"
  },
  license: {
    "id": "license",
    "name": "License",
    "description": "The license of which the video is released under.",
    "required": true,
    "type": "Internal",
    "classId": "Content License"
  },
  attribution: {
    "id": "attribution",
    "name": "Attribution",
    "description": "If the License requires attribution, add this here.",
    "type": "Text",
    "maxTextLength": 255
  }
};
