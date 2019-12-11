
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookEntryFormatValidationSchema = Yup.object().shape({
  format: Yup.string()
    .required('This field is required')
    .max(5, 'Text is too long. Maximum length is 5 chars.'),
  extension: Yup.string()
    .required('This field is required')
    .max(5, 'Text is too long. Maximum length is 5 chars.')
});

export type BookEntryFormatType = {
  format: string
  extension: string
  images: boolean
};

export const BookEntryFormatClass = {
  format: {
    "name": "Format",
    "description": "The name of the file format of the book item.",
    "required": true,
    "type": "Text",
    "maxTextLength": 5
  },
  extension: {
    "name": "Extension",
    "description": "The file extension of the book item.",
    "required": true,
    "type": "Text",
    "maxTextLength": 5
  },
  images: {
    "name": "Images",
    "description": "Wether the book item contains images or not.",
    "required": true,
    "type": "Bool"
  }
};
