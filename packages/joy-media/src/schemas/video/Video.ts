
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const VideoValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  videoThumbnail: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  aboutTheVideo: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  description: Yup.string()
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  attribution: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type VideoType = {
  title: string
  videoThumbnail: string
  aboutTheVideo: string
  language: any
  description?: string
  firstReleased: number
  category?: any
  link?: string[]
  object?: any
  publicationStatus: any
  curationStatus?: any
  explicit: boolean
  license: any
  attribution?: string
};

export const VideoClass = {
  title: {
    "name": "Title",
    "description": "The title of the video",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  videoThumbnail: {
    "name": "Video Thumbnail",
    "description": "URL to video thumbnail: NOTE: Should be an https link to an image of ratio 16:9, ideally 1280 pixels wide by 720 pixels tall, with a minimum width of 640 pixels, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  aboutTheVideo: {
    "name": "About the Video",
    "description": "A short description of the video",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  language: {
    "name": "Language",
    "description": "The main language used in the video.",
    "required": true,
    "type": "Internal",
    "classId": "Language"
  },
  description: {
    "name": "Description",
    "description": "Full description of the video",
    "type": "Text",
    "maxTextLength": 4000
  },
  firstReleased: {
    "name": "First Released",
    "description": "When the video was first released",
    "required": true,
    "type": "Int64"
  },
  category: {
    "name": "Category",
    "description": "The category of the video.",
    "type": "Internal",
    "classId": "Video Category"
  },
  link: {
    "name": "Link",
    "description": "A link to the creators page.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  object: {
    "name": "Object",
    "description": "The entityId of the object in the data directory.",
    "type": "Internal",
    "classId": "Media Object"
  },
  publicationStatus: {
    "name": "Publication Status",
    "description": "The publication status of the video.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "name": "Curation Status",
    "description": "The publication status of the video set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "name": "Explicit",
    "description": "Indicates whether the video contains explicit material.",
    "required": true,
    "type": "Bool"
  },
  license: {
    "name": "License",
    "description": "The license of which the video is released under.",
    "required": true,
    "type": "Internal",
    "classId": "Content License"
  },
  attribution: {
    "name": "Attribution",
    "description": "If the License requires attribution, add this here.",
    "type": "Text",
    "maxTextLength": 255
  }
};
