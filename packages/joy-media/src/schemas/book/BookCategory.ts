
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookCategoryValidationSchema = Yup.object().shape({
  category: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type BookCategoryType = {
  category: string
};

export const BookCategoryClass = {
  category: {
    "name": "Category",
    "description": "Categories for books and book Series.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  }
};
