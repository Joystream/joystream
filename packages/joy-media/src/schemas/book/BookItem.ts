
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookItemValidationSchema = Yup.object().shape({
  title: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  bookItemCover: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  edition: Yup.string()
    .required('This field is required')
    .max(100, 'Text is too long. Maximum length is 100 chars.'),
  aboutTheBook: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.'),
  aboutTheAuthor: Yup.string()
    .required('This field is required')
    .max(4000, 'Text is too long. Maximum length is 4000 chars.')
});

export type BookItemType = {
  title: string
  language: any
  bookItemCover: string
  edition: string
  aboutTheBook: string
  aboutTheAuthor: string
  isbn?: number
  entries?: any[]
  link?: string[]
  reviews?: string[]
  publicationStatus: any
  curationStatus?: any
  explicit: boolean
  license: any
};

export type BookItemPropId =
  'title' |
  'language' |
  'bookItemCover' |
  'edition' |
  'aboutTheBook' |
  'aboutTheAuthor' |
  'isbn' |
  'entries' |
  'link' |
  'reviews' |
  'publicationStatus' |
  'curationStatus' |
  'explicit' |
  'license'
  ;

export type BookItemGenericProp = {
  id: BookItemPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type BookItemClassType = {
  [id in keyof BookItemType]: BookItemGenericProp
};

export const BookItemClass: BookItemClassType = {
  title: {
    "id": "title",
    "name": "Title",
    "description": "Title of the book item in the language of publication.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  language: {
    "id": "language",
    "name": "Language",
    "description": "The language of the book item.",
    "required": true,
    "type": "Internal",
    "classId": "Language"
  },
  bookItemCover: {
    "id": "bookItemCover",
    "name": "Book Item Cover",
    "description": "URL to book a thumbnail of the book cover. Cover should align with language and edition of the book item: NOTE: Should be an https link to an image of ratio 2:3, at least 500 pixels wide, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  edition: {
    "id": "edition",
    "name": "Edition",
    "description": "The edition of the book.",
    "type": "Text",
    "required": true,
    "maxTextLength": 100
  },
  aboutTheBook: {
    "id": "aboutTheBook",
    "name": "About the Book",
    "description": "Information about the book in the language of the book item",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  aboutTheAuthor: {
    "id": "aboutTheAuthor",
    "name": "About the Author",
    "description": "About the author or authors of the book in the language of the book item",
    "required": true,
    "type": "Text",
    "maxTextLength": 4000
  },
  isbn: {
    "id": "isbn",
    "name": "ISBN",
    "description": "The ISBN of the book.",
    "type": "Uint16"
  },
  entries: {
    "id": "entries",
    "name": "Entries",
    "description": "All entries of this book item.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Book Item Entry"
  },
  link: {
    "id": "link",
    "name": "Link",
    "description": "A link to the author or publisher page.",
    "type": "TextVec",
    "maxItems": 5,
    "maxTextLength": 255
  },
  reviews: {
    "id": "reviews",
    "name": "Reviews",
    "description": "Links to reviews of the book in language of the book item.",
    "type": "TextVec",
    "maxItems": 5,
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
  },
  license: {
    "id": "license",
    "name": "License",
    "description": "The license of which the book item is released under.",
    "required": true,
    "type": "Internal",
    "classId": "Content License"
  }
};
