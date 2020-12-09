import { SubstrateEvent } from '../../generated/indexer'
import {
  IClassEntity,
  IProperty,
  IBatchOperation,
  ICreateEntityOperation,
  IEntity,
  IReference,
  IPropertyWithId,
} from '../types'
import Debug from 'debug'

import {
  OperationType,
  ParametrizedClassPropertyValue,
  UpdatePropertyValuesOperation,
} from '@joystream/types/content-directory'
import { createType } from '@joystream/types'
import { Vec } from '@polkadot/types'

const debug = Debug('mappings:cd:decode')

function stringIfyEntityId(event: SubstrateEvent): string {
  const { 1: entityId } = event.params
  return entityId.value as string
}

function setProperties<T>({ extrinsic, blockNumber }: SubstrateEvent, propNamesWithId: IPropertyWithId): T {
  if (extrinsic === undefined) throw Error('Undefined extrinsic')

  const { 3: newPropertyValues } = extrinsic!.args
  const properties: { [key: string]: any; reference?: IReference } = {}

  for (const [k, v] of Object.entries(newPropertyValues.value)) {
    const prop = propNamesWithId[k]
    const singlePropVal = createType('InputPropertyValue', v as any).asType('Single')

    if (singlePropVal.isOfType('Reference')) {
      properties[prop.name] = { entityId: singlePropVal.asType('Reference').toJSON(), existing: true }
    } else {
      const val = singlePropVal.value.toJSON()
      if (typeof val !== prop.type && !prop.required) properties[prop.name] = undefined
      else properties[prop.name] = val
    }
  }
  properties.version = blockNumber

  debug(`Entity properties: ${JSON.stringify(properties)}`)
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
function setEntityPropertyValues<T>(properties: IProperty[], propertyNamesWithId: IPropertyWithId): T {
  const entityProperties: { [key: string]: any; reference?: IReference } = {}

  for (const [propId, propName] of Object.entries(propertyNamesWithId)) {
    // get the property value by id
    const p = properties.find((p) => p.id === propId)
    if (!p) continue

    if (typeof p.value !== propName.type && !propName.required) entityProperties[propName.name] = undefined
    else entityProperties[propName.name] = p.reference ? p.reference : p.value
  }
  debug(`Entity properties: ${JSON.stringify(entityProperties)}`)
  return entityProperties as T
}

// Decode entity property values
function getEntityProperties(propertyValues: ParametrizedClassPropertyValue[]): IProperty[] {
  const properties: IProperty[] = []
  const entityPropertyValues = createType('Vec<ParametrizedClassPropertyValue>', propertyValues)

  entityPropertyValues.map((pv: ParametrizedClassPropertyValue) => {
    const v = createType('ParametrizedPropertyValue', pv.value)
    const propertyId = pv.in_class_index.toJSON()

    let reference
    let value
    if (v.isOfType('InputPropertyValue')) {
      const inputPropVal = v.asType('InputPropertyValue')
      value = inputPropVal.isOfType('Single')
        ? inputPropVal.asType('Single').value.toJSON()
        : inputPropVal.asType('Vector').value.toJSON()

      if (inputPropVal.isOfType('Single')) {
        if (inputPropVal.asType('Single').isOfType('Reference')) {
          reference = { entityId: value as number, existing: true }
        }
      }
    } else if (v.isOfType('InternalEntityJustAdded')) {
      value = v.asType('InternalEntityJustAdded').toJSON()
      reference = { entityId: value as number, existing: false }
    } else {
      // TODO: Add support for v.asType('InternalEntityVec')
      throw Error('InternalEntityVec property type is not supported yet!')
    }
    properties.push({ id: `${propertyId}`, value, reference })
  })
  return properties
}

function getOperations(event: SubstrateEvent): Vec<OperationType> {
  if (!event.extrinsic) throw Error(`No extrinsic found for ${event.id}`)
  return createType('Vec<OperationType>', (event.extrinsic.args[1].value as unknown) as Vec<OperationType>)
}

function getOperationsByTypes(operations: OperationType[]): IBatchOperation {
  const updatePropertyValuesOperations: IEntity[] = []
  const addSchemaSupportToEntityOperations: IEntity[] = []
  const createEntityOperations: ICreateEntityOperation[] = []

  for (const operation of operations) {
    if (operation.isOfType('CreateEntity')) {
      const cep = operation.asType('CreateEntity')
      createEntityOperations.push({ classId: cep.class_id.toJSON() })
    } else if (operation.isOfType('AddSchemaSupportToEntity')) {
      const op = operation.asType('AddSchemaSupportToEntity')
      const pe = createType('ParameterizedEntity', op.entity_id)
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
  const pe = createType('ParameterizedEntity', upv.entity_id)
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
  getOperationsByTypes,
  setProperties,
  getOperations,
}
