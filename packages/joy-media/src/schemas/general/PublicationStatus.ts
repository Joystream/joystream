
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const PublicationStatusValidationSchema = Yup.object().shape({
  status: Yup.string()
    .required('This field is required')
    .max(50, 'Text is too long. Maximum length is 50 chars.')
});

export type PublicationStatusType = {
  status: string
};

export const PublicationStatusClass = {
  status: {
    "name": "Status",
    "description": "The publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 50
  }
};
