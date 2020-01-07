
/** This file is generated based on JSON schema. Do not modify. */

import * as Yup from 'yup';
import { EntityCodec } from '@joystream/types/versioned-store/EntityCodec';

export const PublicationStatusValidationSchema = Yup.object().shape({
  status: Yup.string()
    .required('This field is required')
    .max(50, 'Text is too long. Maximum length is 50 chars.')
});

export type PublicationStatusFormValues = {
  status: string
};

export type PublicationStatusType = {
  status: string
};

export const PublicationStatusCodec = new EntityCodec<PublicationStatusType>();

export type PublicationStatusPropId =
  'status'
  ;

export type PublicationStatusGenericProp = {
  id: PublicationStatusPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type PublicationStatusClassType = {
  [id in PublicationStatusPropId]: PublicationStatusGenericProp
};

export const PublicationStatusClass: PublicationStatusClassType = {
  status: {
    "id": "status",
    "name": "Status",
    "description": "The publication status of the content in the content directory.",
    "required": true,
    "type": "Text",
    "maxTextLength": 50
  }
};
