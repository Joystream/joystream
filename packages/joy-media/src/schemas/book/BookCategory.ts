
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

export type BookCategoryPropId =
  'category'
  ;

export type BookCategoryGenericProp = {
  id: BookCategoryPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type BookCategoryClassType = {
  [id in BookCategoryPropId]: BookCategoryGenericProp
};

export const BookCategoryClass: BookCategoryClassType = {
  category: {
    "id": "category",
    "name": "Category",
    "description": "Categories for books and book Series.",
    "type": "Text",
    "required": true,
    "maxTextLength": 255
  }
};
