
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookValidationSchema = Yup.object().shape({
  titleInEnglish: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  originalTitle: Yup.string()
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  internationalBookCover: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  aboutTheBook: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.'),
  aboutTheAuthor: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type BookType = {
  titleInEnglish: string
  originalTitle?: string
  authorOfBook: string[]
  yearOfRelease: any
  originalLanguage: any
  internationalBookCover: string
  aboutTheBook: string
  aboutTheAuthor: string
  bookCategory: any
  bookItem?: any[]
  publicationStatus: any
  curationStatus?: any
};

export const BookClass = {
  titleInEnglish: {
    "name": "Title in English",
    "description": "Title of the book in English.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  },
  originalTitle: {
    "name": "Original Title",
    "description": "Title of the book in the language was originally written.",
    "type": "Text",
    "required": false,
    "maxTextLength": 255
  },
  authorOfBook: {
    "name": "Author of Book",
    "description": "The author or authors of the book",
    "type": "TextVec",
    "required": true,
    "maxItems": 10,
    "maxTextLength": 100
  },
  yearOfRelease: {
    "name": "Year of Release",
    "description": "The year the book was first published in its original language.",
    "required": true,
    "type": "Internal",
    "classId": "Year"
  },
  originalLanguage: {
    "name": "Original Language",
    "description": "Title of the book in the language was originally written.",
    "type": "Internal",
    "required": true,
    "classId": "Language"
  },
  internationalBookCover: {
    "name": "International Book Cover",
    "description": "URL to book a thumbnail of the book cover. First edition in English if available, first edition in original language otherwise: NOTE: Should be an https link to an image of ratio 2:3, at least 500 pixels wide, in JPEG or PNG format.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  aboutTheBook: {
    "name": "About the Book",
    "description": "Information about the book in English",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  aboutTheAuthor: {
    "name": "About the Author",
    "description": "About the author or authors of the book in English",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  },
  bookCategory: {
    "name": "Book Category",
    "description": "About the author or authors of the book in English",
    "required": true,
    "type": "Internal",
    "classId": "Book Category"
  },
  bookItem: {
    "name": "Book Item",
    "description": "A specific publication of the book. Ie. translation, illustrated version, etc.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Book Item"
  },
  publicationStatus: {
    "name": "Publication Status",
    "description": "The publication status of the book.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  },
  curationStatus: {
    "name": "Curation Status",
    "description": "The publication status of the book set by the a content curator on the platform.",
    "type": "Internal",
    "classId": "Curation Status"
  }
};
