
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

export type BookSeriesPropId =
  'title' |
  'description' |
  'bookCover' |
  'language' |
  'booksInTheSeries' |
  'author' |
  'synopsis' |
  'publicationStatus' |
  'curationStatus' |
  'explicit'
  ;

export type BookSeriesGenericProp = {
  id: BookSeriesPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type BookSeriesClassType = {
  [id in BookSeriesPropId]: BookSeriesGenericProp
};

export const BookSeriesClass: BookSeriesClassType = {
  title: {
    "id": "title",
    "name": "Title",
    "description": "The title of the book series",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Description of the book series",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  bookCover: {
    "id": "bookCover",
    "name": "Book Cover",
    "description": "URL to book thumbnail: TODO",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  language: {
    "id": "language",
    "name": "Language",
    "description": "The language(s) the book series is available in.",
    "required": true,
    "type": "InternalVec",
    "maxItems": 184,
    "classId": "Language"
  },
  booksInTheSeries: {
    "id": "booksInTheSeries",
    "name": "Books in the series",
    "description": "The books that are in the series",
    "type": "InternalVec",
    "maxItems": 2000,
    "classId": "Book Series Entry"
  },
  author: {
    "id": "author",
    "name": "Author",
    "description": "The author or authors of the series",
    "type": "Text",
    "maxTextLength": 255
  },
  synopsis: {
    "id": "synopsis",
    "name": "Synopsis",
    "description": "A short description of the series",
    "type": "Text",
    "maxTextLength": 255
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the book item.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "id": "curationStatus",
    "name": "Curation Status",
    "description": "The publication status of the book item set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  },
  explicit: {
    "id": "explicit",
    "name": "Explicit",
    "description": "Indicates whether the book item contains explicit material.",
    "required": true,
    "type": "Bool"
  }
};
