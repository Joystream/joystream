
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';

export const CurationStatusValidationSchema = Yup.object().shape({
  status: Yup.string()
    .required('This field is required')
    .max(255, 'Text is too long. Maximum length is 255 chars.')
});

export type CurationStatusFormValues = {
  status: string
};

export type CurationStatusType = {
  status: string
};

export type CurationStatusPropId =
  'status'
  ;

export type CurationStatusGenericProp = {
  id: CurationStatusPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type CurationStatusClassType = {
  [id in CurationStatusPropId]: CurationStatusGenericProp
};

export const CurationStatusClass: CurationStatusClassType = {
  status: {
    "id": "status",
    "name": "Status",
    "description": "The curator publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 255
  }
};
