import { SubstrateEvent } from '../../generated/indexer'
import {
  IPropertyIdWithName,
  IClassEntity,
  IProperty,
  IBatchOperation,
  ICreateEntityOperation,
  IEntity,
} from '../types'

import {
  ParametrizedClassPropertyValue,
  ParametrizedPropertyValue,
  ParameterizedEntity,
  UpdatePropertyValuesOperation,
  InputPropertyValue,
  OperationType,
} from '@joystream/types/content-directory'
import { createType } from '@joystream/types'

function stringIfyEntityId(event: SubstrateEvent): string {
  const { 1: entityId } = event.params
  return entityId.value as string
}

function setProperties<T>({ extrinsic, blockNumber }: SubstrateEvent, propNamesWithId: IPropertyIdWithName): T {
  if (extrinsic === undefined) throw Error('Undefined extrinsic')

  const { 3: newPropertyValues } = extrinsic!.args
  const properties: { [key: string]: any } = {}

  for (const [k, v] of Object.entries(newPropertyValues.value)) {
    const propertyName = propNamesWithId[k]
    const propertyValue = (createType('InputPropertyValue' as never, v as never) as InputPropertyValue)
      .asType('Single')
      .value.toJSON()
    properties[propertyName] = propertyValue
  }
  properties.version = blockNumber
  return properties as T
}

function getClassEntity(event: SubstrateEvent): IClassEntity {
  const { 0: classId } = event.extrinsic!.args
  const { 1: entityId } = event.params
  return {
    entityId: (entityId.value as unknown) as number,
    classId: (classId.value as unknown) as number,
  }
}

/**
 * When entity is creation through `transaction` extrinsic we use this function to parse
 * entity properties it looks quite similar to `setProperties` function
 * @param properties
 * @param propertyNamesWithId
 */
function setEntityPropertyValues<T>(properties: IProperty[], propertyNamesWithId: IPropertyIdWithName): T {
  const entityProperties: { [key: string]: any } = {}

  for (const [propId, propName] of Object.entries(propertyNamesWithId)) {
    // get the property value by id
    const p = properties.find((p) => p.propertyId === propId)
    const propertyValue = p ? p.value : undefined
    entityProperties[propName] = propertyValue
  }
  // console.log(entityProperties);
  return entityProperties as T
}

// Decode entity property values
function getEntityProperties(propertyValues: ParametrizedClassPropertyValue[]): IProperty[] {
  const properties: IProperty[] = []
  const entityPropertyValues = createType(
    'Vec<ParametrizedClassPropertyValue>' as never,
    propertyValues as never
  ) as ParametrizedClassPropertyValue[]

  entityPropertyValues.map((pv: ParametrizedClassPropertyValue) => {
    const v = createType('ParametrizedPropertyValue' as never, pv.value as never) as ParametrizedPropertyValue
    const propertyId = pv.in_class_index.toJSON()

    let value
    if (v.isOfType('InputPropertyValue')) {
      const inputPropVal = v.asType('InputPropertyValue')
      value = inputPropVal.isOfType('Single')
        ? inputPropVal.asType('Single').value.toJSON()
        : inputPropVal.asType('Vector').value.toJSON()
    } else if (v.isOfType('InternalEntityJustAdded')) {
      // const inputPropVal = v.asType('InternalEntityJustAdded');
      value = v.asType('InternalEntityJustAdded').toJSON()
    } else {
      // TODO: Add support for v.asType('InternalEntityVec')
      throw Error('InternalEntityVec property type is not supported yet!')
    }
    properties.push({ propertyId: `${propertyId}`, value })
  })
  return properties
}

function getOperations({ extrinsic }: SubstrateEvent): IBatchOperation {
  const operations = createType('Vec<OperationType>' as never, extrinsic!.args[1].value as never) as OperationType[]

  const updatePropertyValuesOperations: IEntity[] = []
  const addSchemaSupportToEntityOperations: IEntity[] = []
  const createEntityOperations: ICreateEntityOperation[] = []

  for (const operation of operations) {
    if (operation.isOfType('CreateEntity')) {
      const cep = operation.asType('CreateEntity')
      createEntityOperations.push({ classId: cep.class_id.toJSON() })
    } else if (operation.isOfType('AddSchemaSupportToEntity')) {
      const op = operation.asType('AddSchemaSupportToEntity')
      const pe = createType('ParameterizedEntity' as never, op.entity_id as never) as ParameterizedEntity
      const entity: IEntity = {
        properties: getEntityProperties(op.parametrized_property_values),
      }
      if (pe.isOfType('InternalEntityJustAdded')) {
        entity.indexOf = pe.asType('InternalEntityJustAdded').toJSON()
      } else {
        entity.entityId = pe.asType('ExistingEntity').toJSON()
      }
      addSchemaSupportToEntityOperations.push(entity)
    } else {
      updatePropertyValuesOperations.push(makeEntity(operation.asType('UpdatePropertyValues')))
    }
  }
  return {
    updatePropertyValuesOperations,
    addSchemaSupportToEntityOperations,
    createEntityOperations,
  }
}

function makeEntity(upv: UpdatePropertyValuesOperation): IEntity {
  const entity: IEntity = {
    properties: getEntityProperties(upv.new_parametrized_property_values),
  }
  const pe = createType('ParameterizedEntity' as never, upv.entity_id as never) as ParameterizedEntity
  if (pe.isOfType('InternalEntityJustAdded')) {
    entity.indexOf = pe.asType('InternalEntityJustAdded').toJSON()
  } else {
    entity.entityId = pe.asType('ExistingEntity').toJSON()
  }
  return entity
}

export const decode = {
  stringIfyEntityId,
  getClassEntity,
  setEntityPropertyValues,
  getEntityProperties,
  getOperations,
  setProperties,
}
