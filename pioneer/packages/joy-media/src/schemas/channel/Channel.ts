
import * as Yup from 'yup';
import { BlockNumber, AccountId } from '@polkadot/types/interfaces';
import { ChannelContentTypeValue, PrincipalId, Channel, ChannelId, ChannelPublicationStatusValue, ChannelCurationStatusValue } from '@joystream/types/content-working-group';
import { MemberId } from '@joystream/types/members';
import { ChannelValidationConstraints } from '@polkadot/joy-media/transport';
import { ValidationConstraint } from '@polkadot/joy-utils/ValidationConstraint';

function textValidation (constraint?: ValidationConstraint) {
  if (!constraint) {
    return Yup.string()
  }
  
  const { min, max } = constraint
  return Yup.string()
    .min(min, `Text is too short. Minimum length is ${min} chars.`)
    .max(max, `Text is too long. Maximum length is ${max} chars.`)
}
export const buildChannelValidationSchema = (constraints?: ChannelValidationConstraints) =>
  Yup.object().shape({
    handle: textValidation(constraints?.handle).required('This field is required'),
    title: textValidation(constraints?.title),
    description: textValidation(constraints?.description),
    avatar: textValidation(constraints?.avatar),
    banner: textValidation(constraints?.banner)
  });

export type ChannelFormValues = {
  content: ChannelContentTypeValue
  handle: string
  title: string
  description: string
  avatar: string
  banner: string
  publicationStatus: ChannelPublicationStatusValue
};

export type ChannelType = {
  id: number
  verified: boolean
  handle: string
  title?: string
  description?: string
  avatar?: string
  banner?: string
  content: ChannelContentTypeValue
  owner: MemberId
  roleAccount: AccountId
  publicationStatus: ChannelPublicationStatusValue
  curationStatus: ChannelCurationStatusValue
  created: BlockNumber
  principalId: PrincipalId
};

export class ChannelCodec {
  static fromSubstrate(id: ChannelId, sub: Channel): ChannelType {
    return {
      id: id.toNumber(),
      verified: sub.getBoolean('verified'),
      handle: sub.getString('handle'),
      title: sub.getOptionalString('title'),
      description: sub.getOptionalString('description'),
      avatar: sub.getOptionalString('avatar'),
      banner: sub.getOptionalString('banner'),
      content: sub.getEnumAsString<ChannelContentTypeValue>('content'),
      owner: sub.getField('owner'),
      roleAccount: sub.getField('role_account'),
      publicationStatus: sub.getEnumAsString<ChannelPublicationStatusValue>('publication_status'),
      curationStatus: sub.getEnumAsString<ChannelCurationStatusValue>('curation_status'),
      created: sub.getField('created'),
      principalId: sub.getField('principal_id')
    }
  }
}

export function ChannelToFormValues(entity?: ChannelType): ChannelFormValues {
  return {
    content: entity && entity.content || 'Video',
    handle: entity && entity.handle || '',
    title: entity && entity.title || '',
    description: entity && entity.description || '',
    avatar: entity && entity.avatar || '',
    banner: entity && entity.banner || '',
    publicationStatus: entity && entity.publicationStatus || 'Public'
  }
}

export type ChannelPropId =
  'content' |
  'handle' |
  'title' |
  'description' |
  'avatar' |
  'banner' |
  'publicationStatus'
  ;

export type ChannelGenericProp = {
  id: ChannelPropId,
  type: string,
  name: string,
  description?: string,
  required?: boolean,
  maxItems?: number,
  maxTextLength?: number,
  classId?: any
};

type ChannelClassType = {
  [id in ChannelPropId]: ChannelGenericProp
};

export const ChannelClass: ChannelClassType = {
  content: {
    "id": "content",
    "name": "Content",
    "description": "The type of channel.",
    "type": "Text",
    "required": true,
    "maxTextLength": 100
  },
  handle: {
    "id": "handle",
    "name": "Handle",
    "description": "Unique URL handle of channel.",
    "type": "Text",
    "required": true,
    "maxTextLength": 40
  },
  title: {
    "id": "title",
    "name": "Title",
    "description": "Human readable title of channel.",
    "type": "Text",
    "maxTextLength": 100
  },
  description: {
    "id": "description",
    "name": "Description",
    "description": "Human readable description of channel purpose and scope.",
    "type": "Text",
    "maxTextLength": 4000
  },
  avatar: {
    "id": "avatar",
    "name": "Avatar",
    "description": "URL to avatar (logo) iamge: NOTE: Should be an https link to a square image.",
    "type": "Text",
    "maxTextLength": 1000
  },
  banner: {
    "id": "banner",
    "name": "Banner",
    "description": "URL to banner image: NOTE: Should be an https link to a rectangular image, between 1400x1400 and 3000x3000 pixels, in JPEG or PNG format.",
    "type": "Text",
    "maxTextLength": 1000
  },
  publicationStatus: {
    "id": "publicationStatus",
    "name": "Publication Status",
    "description": "The publication status of the channel.",
    "required": true,
    "type": "Internal",
    "classId": "Publication Status"
  }
};
