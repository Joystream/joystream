import BN from 'bn.js'
import { EntityId, SchemaId, ParametrizedClassPropertyValue, ClassId } from '@joystream/types/content-directory'
import { DB } from '../generated/indexer'

export interface BaseJoystreamMember {
  memberId: BN
}

export interface JoystreamMember extends BaseJoystreamMember {
  handle: string
  avatarUri: string
  about: string
  registeredAtBlock: number
  rootAccount: Buffer
  controllerAccount: Buffer
}

export interface MemberAboutText extends BaseJoystreamMember {
  about: string
}

export interface MemberAvatarURI extends BaseJoystreamMember {
  avatarUri: string
}

export interface MemberHandle extends BaseJoystreamMember {
  handle: string
}

export interface MemberRootAccount extends BaseJoystreamMember {
  rootAccount: Buffer
}
export interface MemberControllerAccount extends BaseJoystreamMember {
  controllerAccount: Buffer
}

export interface IChannel {
  title: string
  description: string
  coverPhotoURL: string
  avatarPhotoURL: string
  isPublic: boolean
  isCurated: boolean
  language: number
}

export interface ICategory {
  name: string
  description: string
}

export interface IKnownLicense {
  code: string
  name?: string
  description?: string
  url?: string
}

export interface IUserDefinedLicense {
  content: string
}

export interface IJoystreamMediaLocation {
  dataObjectId: string
}

export interface IHttpMediaLocation {
  url: string
  port?: number
}

export interface ILanguage {
  name: string
  code: string
}

export interface IVideoMediaEncoding {
  name: string
}

export interface IVideoMedia {
  encoding: number
  pixelWidth: number
  pixelHeight: number
  size: number
  location: number
}

export interface IVideo {
  // referenced entity's id
  channel: number
  // referenced entity's id
  category: number
  title: string
  description: string
  duration: number
  skippableIntroDuration?: number
  thumbnailURL: string
  language: number
  // referenced entity's id
  media: number
  hasMarketing?: boolean
  publishedBeforeJoystream?: number
  isPublic: boolean
  isCurated: boolean
  isExplicit: boolean
  license: number
}

export enum OperationType {
  CreateEntity = 'CreateEntity',
  AddSchemaSupportToEntity = 'AddSchemaSupportToEntity',
  UpdatePropertyValues = 'UpdatePropertyValues',
}

export interface IAddSchemaSupportToEntity {
  entity_id: EntityId
  schema_id: SchemaId
  parametrized_property_values: ParametrizedClassPropertyValue[]
}

export interface ICreateEntity {
  class_id: ClassId
}

export interface IClassEntity {
  entityId: number
  classId: number
}

export interface IBatchOperation {
  createEntityOperations: ICreateEntityOperation[]
  addSchemaSupportToEntityOperations: IEntity[]
  updatePropertyValuesOperations: IEntity[]
}

export interface IProperty {
  [propertyId: string]: any
  // propertyId: string;
  // value: any;
}

export interface IEntity {
  classId?: number
  entityId?: number
  // if entity is created in the same transaction, this is the entity id which is the index of the create
  // entity operation
  indexOf?: number
  properties: IProperty[]
}

export interface IPropertyIdWithName {
  // propertyId - property name
  [propertyId: string]: string
}

export interface IWhereCond {
  where: { id: string }
}

export interface ICreateEntityOperation {
  classId: number
}

// An interface to use in function signature to simplify function parameters
export interface IDBBlockId {
  db: DB
  block: number
  id: string
}
