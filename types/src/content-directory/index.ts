import { BTreeMap, Option, Tuple, Text, Vec } from '@polkadot/types'
import { bool, u64, u32, u16, i16, i32, i64, Null } from '@polkadot/types/primitive'
import { MemberId } from '../members'
import { JoyStructDecorated, JoyEnum, Hash, JoyBTreeSet } from '../common'

export class Nonce extends u64 {}
export class EntityId extends u64 {}
export class ClassId extends u64 {}
export class CuratorId extends u64 {}
export class CuratorGroupId extends u64 {}
export class VecMaxLength extends u16 {}
export class TextMaxLength extends u16 {}
export class HashedTextMaxLength extends Option.with(u16) {}
export class PropertyId extends u16 {}
export class SchemaId extends u16 {}
export class SameController extends bool {}

export class ClassPermissions extends JoyStructDecorated({
  any_member: bool,
  entity_creation_blocked: bool,
  all_entity_property_values_locked: bool,
  maintainers: JoyBTreeSet(CuratorGroupId),
}) {}

// Named just "Type" in the runtime, but this name conflicts with @polkadot/types/primitive/Type.ts
export class PropertyTypeSingle extends JoyEnum({
  Bool: Null,
  Uint16: Null,
  Uint32: Null,
  Uint64: Null,
  Int16: Null,
  Int32: Null,
  Int64: Null,
  Text: TextMaxLength,
  Hash: HashedTextMaxLength,
  Reference: Tuple.with([ClassId, SameController]),
}) {}

export class PropertyTypeVector extends JoyStructDecorated({
  vec_type: PropertyTypeSingle,
  max_length: VecMaxLength,
}) {}

export class PropertyType extends JoyEnum({
  Single: PropertyTypeSingle,
  Vector: PropertyTypeVector,
}) {
  get subtype() {
    return this.isOfType('Single') ? this.asType('Single').type : this.asType('Vector').vec_type.type
  }

  toInputPropertyValue(value: any): InputPropertyValue {
    const inputPwType: keyof typeof InputPropertyValue['typeDefinitions'] = this.type
    const subtype = this.subtype

    if (inputPwType === 'Single') {
      const inputPwSubtype: keyof typeof InputValue['typeDefinitions'] = subtype === 'Hash' ? 'TextToHash' : subtype

      return new InputPropertyValue(this.registry, { [inputPwType]: { [inputPwSubtype]: value } })
    } else {
      const inputPwSubtype: keyof typeof VecInputValue['typeDefinitions'] = subtype === 'Hash' ? 'TextToHash' : subtype

      return new InputPropertyValue(this.registry, { [inputPwType]: { [inputPwSubtype]: value } })
    }
  }
}

export class PropertyLockingPolicy extends JoyStructDecorated({
  is_locked_from_maintainer: bool,
  is_locked_from_controller: bool,
}) {}

export class Property extends JoyStructDecorated({
  property_type: PropertyType,
  required: bool,
  unique: bool,
  name: Text,
  description: Text,
  locking_policy: PropertyLockingPolicy,
}) {}

export class Schema extends JoyStructDecorated({
  properties: JoyBTreeSet(PropertyId),
  is_active: bool,
}) {}

export class Class extends JoyStructDecorated({
  class_permissions: ClassPermissions,
  properties: Vec.with(Property),
  schemas: Vec.with(Schema),
  name: Text,
  description: Text,
  maximum_entities_count: EntityId,
  current_number_of_entities: EntityId,
  default_entity_creation_voucher_upper_bound: EntityId,
}) {}

export class EntityController extends JoyEnum({
  Maintainers: Null,
  Member: MemberId,
  Lead: Null,
}) {}

export class EntityPermissions extends JoyStructDecorated({
  controller: EntityController,
  frozen: bool,
  referenceable: bool,
}) {}

export class StoredValue extends JoyEnum({
  Bool: bool,
  Uint16: u16,
  Uint32: u32,
  Uint64: u64,
  Int16: i16,
  Int32: i32,
  Int64: i64,
  Text: Text,
  Hash: Hash,
  Reference: EntityId,
}) {}

export class VecStoredValue extends JoyEnum({
  Bool: Vec.with(bool),
  Uint16: Vec.with(u16),
  Uint32: Vec.with(u32),
  Uint64: Vec.with(u64),
  Int16: Vec.with(i16),
  Int32: Vec.with(i32),
  Int64: Vec.with(i64),
  Hash: Vec.with(Hash),
  Text: Vec.with(Text),
  Reference: Vec.with(EntityId),
}) {}

export class VecStoredPropertyValue extends JoyStructDecorated({
  vec_value: VecStoredValue,
  nonce: Nonce,
}) {}

export class StoredPropertyValue extends JoyEnum({
  Single: StoredValue,
  Vector: VecStoredPropertyValue,
}) {
  get subtype() {
    return this.isOfType('Single') ? this.asType('Single').type : this.asType('Vector').vec_value.type
  }

  public getValue() {
    return this.isOfType('Single') ? this.asType('Single').value : this.asType('Vector').vec_value.value
  }
}

export class InboundReferenceCounter extends JoyStructDecorated({
  total: u32,
  same_owner: u32,
}) {}

export class Entity extends JoyStructDecorated({
  entity_permissions: EntityPermissions,
  class_id: ClassId,
  supported_schemas: JoyBTreeSet(SchemaId),
  values: BTreeMap.with(PropertyId, StoredPropertyValue),
  reference_counter: InboundReferenceCounter,
}) {}

export class CuratorGroup extends JoyStructDecorated({
  curators: JoyBTreeSet(CuratorId),
  active: bool,
  number_of_classes_maintained: u32,
}) {}

export class EntityCreationVoucher extends JoyStructDecorated({
  maximum_entities_count: EntityId,
  entities_created: EntityId,
}) {}

export class Actor extends JoyEnum({
  Curator: Tuple.with([CuratorGroupId, CuratorId]),
  Member: MemberId,
  Lead: Null,
}) {}

export class EntityReferenceCounterSideEffect extends JoyStructDecorated({
  /// Delta number of all inbound references from another entities
  total: i32,
  /// Delta number of inbound references from another entities with `SameOwner` flag set
  same_owner: i32,
}) {}

export class ReferenceCounterSideEffects extends BTreeMap.with(EntityId, EntityReferenceCounterSideEffect) {}

export class SideEffects extends Option.with(ReferenceCounterSideEffects) {}
export class SideEffect extends Option.with(Tuple.with([EntityId, EntityReferenceCounterSideEffect])) {}
export class Status extends bool {}

export class InputValue extends JoyEnum({
  Bool: bool,
  Uint16: u16,
  Uint32: u32,
  Uint64: u64,
  Int16: i16,
  Int32: i32,
  Int64: i64,
  Text: Text,
  // Used to pass text value, which respective hash should be stored
  TextToHash: Text,
  Reference: EntityId,
}) {}

export class VecInputValue extends JoyEnum({
  Bool: Vec.with(bool),
  Uint16: Vec.with(u16),
  Uint32: Vec.with(u32),
  Uint64: Vec.with(u64),
  Int16: Vec.with(i16),
  Int32: Vec.with(i32),
  Int64: Vec.with(i64),
  TextToHash: Vec.with(Text),
  Text: Vec.with(Text),
  Reference: Vec.with(EntityId),
}) {}

export class InputPropertyValue extends JoyEnum({
  Single: InputValue,
  Vector: VecInputValue,
}) {}

export class ParameterizedEntity extends JoyEnum({
  InternalEntityJustAdded: u32,
  ExistingEntity: EntityId,
}) {}

export class ParametrizedPropertyValue extends JoyEnum({
  InputPropertyValue: InputPropertyValue,
  InternalEntityJustAdded: u32,
  InternalEntityVec: Vec.with(ParameterizedEntity),
}) {}

export class ParametrizedClassPropertyValue extends JoyStructDecorated({
  in_class_index: PropertyId,
  value: ParametrizedPropertyValue,
}) {}

export class CreateEntityOperation extends JoyStructDecorated({
  class_id: ClassId,
}) {}

export class UpdatePropertyValuesOperation extends JoyStructDecorated({
  entity_id: ParameterizedEntity,
  new_parametrized_property_values: Vec.with(ParametrizedClassPropertyValue),
}) {}

export class AddSchemaSupportToEntityOperation extends JoyStructDecorated({
  entity_id: ParameterizedEntity,
  schema_id: SchemaId,
  parametrized_property_values: Vec.with(ParametrizedClassPropertyValue),
}) {}

export class OperationType extends JoyEnum({
  CreateEntity: CreateEntityOperation,
  UpdatePropertyValues: UpdatePropertyValuesOperation,
  AddSchemaSupportToEntity: AddSchemaSupportToEntityOperation,
}) {}

// Versioned store relicts - to be removed:
export class ClassPermissionsType extends Null {}
export class ClassPropertyValue extends Null {}
export class Operation extends Null {}
export class ReferenceConstraint extends Null {}

export class InputEntityValuesMap extends BTreeMap.with(PropertyId, InputPropertyValue) {}

export class FailedAt extends u32 {}

export const contentDirectoryTypes = {
  Nonce,
  EntityId,
  ClassId,
  CuratorGroupId,
  VecMaxLength,
  TextMaxLength,
  HashedTextMaxLength,
  PropertyId,
  SchemaId,
  SameController,
  ClassPermissions,
  PropertyTypeSingle,
  PropertyTypeVector,
  PropertyType,
  PropertyLockingPolicy,
  Property,
  Schema,
  Class,
  ClassOf: Class,
  EntityController,
  EntityPermissions,
  StoredValue,
  VecStoredValue,
  VecStoredPropertyValue,
  StoredPropertyValue,
  InboundReferenceCounter,
  Entity,
  EntityOf: Entity,
  CuratorGroup,
  EntityCreationVoucher,
  Actor,
  EntityReferenceCounterSideEffect,
  ReferenceCounterSideEffects,
  SideEffects,
  SideEffect,
  Status,
  InputValue,
  VecInputValue,
  InputPropertyValue,
  ParameterizedEntity,
  ParametrizedPropertyValue,
  ParametrizedClassPropertyValue,
  CreateEntityOperation,
  UpdatePropertyValuesOperation,
  AddSchemaSupportToEntityOperation,
  OperationType,
  InputEntityValuesMap,
  // Versioned store relicts - to be removed:
  ClassPermissionsType,
  ClassPropertyValue,
  Operation,
  ReferenceConstraint,
  FailedAt,
}

export default contentDirectoryTypes
