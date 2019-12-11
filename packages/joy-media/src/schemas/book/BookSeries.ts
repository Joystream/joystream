
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookSeriesValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  description: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  bookCover: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  author: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  synopsis: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type BookSeriesType = {
  title: string
  description: string
  bookCover: string
  language: any[]
  booksInTheSeries?: any[]
  author?: string
  synopsis?: string
  publicationStatus: any
  curationStatus?: any
  explicit: boolean
};

export const BookSeriesClass = {
  title: {
    "name": "Title",
    "description": "The title of the book series",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  description: {
    "name": "Description",
    "description": "Description of the book series",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  bookCover: {
    "name": "Book Cover",
    "description": "URL to book thumbnail: TODO",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  language: {
    "name": "Language",
    "description": "The language(s) the book series is available in.",
    "required": true,
    "type": "InternalVec",
    "maxItems": 184,
    "classId": "Language"
  },
  booksInTheSeries: {
    "name": "Books in the series",
    "description": "The books that are in the series",
    "type": "InternalVec",
    "maxItems": 2000,
    "classId": "Book Series Entry"
  },
  author: {
    "name": "Author",
    "description": "The author or authors of the series",
    "type": "Text",
    "maxTextLength": 255
  },
  synopsis: {
    "name": "Synopsis",
    "description": "A short description of the series",
    "type": "Text",
    "maxTextLength": 255
  },
  publicationStatus: {
    "name": "Publication Status",
    "description": "The publication status of the book item.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "name": "Curation Status",
    "description": "The publication status of the book item set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "name": "Explicit",
    "description": "Indicates whether the book item contains explicit material.",
    "required": true,
    "type": "Bool"
  }
};
