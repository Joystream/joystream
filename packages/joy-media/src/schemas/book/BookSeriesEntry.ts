
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookSeriesEntryValidationSchema = Yup.object().shape({
  // No validation rules.
});

export type BookSeriesEntryType = {
  bookItem?: any[]
};

export type BookSeriesEntryPropId =
  'bookItem'
  ;

export type BookSeriesEntryGenericProp = {
  id: BookSeriesEntryPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type BookSeriesEntryClassType = {
  [id in BookSeriesEntryPropId]: BookSeriesEntryGenericProp
};

export const BookSeriesEntryClass: BookSeriesEntryClassType = {
  bookItem: {
    "id": "bookItem",
    "name": "Book Item",
    "description": "A specific publication of the book. Ie. translation, illustrated version, etc.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Book Item"
  }
};
