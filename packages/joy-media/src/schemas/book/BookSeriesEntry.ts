
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const BookSeriesEntryValidationSchema = Yup.object().shape({
  // No validation rules.
});

export type BookSeriesEntryType = {
  bookItem?: any[]
};

export const BookSeriesEntryClass = {
  bookItem: {
    "name": "Book Item",
    "description": "A specific publication of the book. Ie. translation, illustrated version, etc.",
    "type": "InternalVec",
    "maxItems": 100,
    "classId": "Book Item"
  }
};
