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

export interface IReference {
  entityId: number
  existing: boolean
}

export interface IChannel {
  handle: string
  description: string
  coverPhotoUrl: string
  avatarPhotoUrl: string
  isPublic: boolean
  isCurated?: boolean
  language?: IReference
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
  encoding?: IReference
  pixelWidth: number
  pixelHeight: number
  size: number
  location?: IReference
}

export interface IVideo {
  // referenced entity's id
  channel?: IReference
  // referenced entity's id
  category?: IReference
  title: string
  description: string
  duration: number
  skippableIntroDuration?: number
  thumbnailUrl: string
  language?: IReference
  // referenced entity's id
  media?: IReference
  hasMarketing?: boolean
  publishedBeforeJoystream?: number
  isPublic: boolean
  isCurated?: boolean
  isExplicit: boolean
  license?: IReference
}

export interface ILicense {
  knownLicense?: IReference
  userDefinedLicense?: IReference
}

export interface IMediaLocation {
  httpMediaLocation?: IReference
  joystreamMediaLocation?: IReference
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
  // PropertId: Value
  // [propertyId: string]: any

  id: string
  value: any

  // If reference.exising is false then reference.entityId is the index that entity is at
  // in the transaction batch operation
  reference?: IReference
}

export interface IEntity {
  classId?: number
  entityId?: number
  // if entity is created in the same transaction, this is the entity id which is the index of the create
  // entity operation
  indexOf?: number
  properties: IProperty[]
}

export interface IPropertyDef {
  name: string
  type: string
  required: boolean
}

export interface IPropertyWithId {
  [inClassIndex: string]: IPropertyDef
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
  // Entity id
  id: string
}

export type ClassEntityMap = Map<string, IEntity[]>
