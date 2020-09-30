import { AddClassSchema } from '../../types/extrinsics/AddClassSchema'
import { FetchedInput } from './inputs'
import { createType } from '@joystream/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import { OperationType, ParametrizedPropertyValue } from '@joystream/types/content-directory'

// TODO: Make it more typesafe
type Batch = Record<string, any>[]
type FetchedBatch = FetchedInput<Batch>

export class EntityBatchesParser {
  schemaInputs: FetchedInput<AddClassSchema>[]
  batchInputs: FetchedBatch[]
  operations: OperationType[] = []
  entityIndexByUniqueQueryMap = new Map<string, number>()

  constructor(schemaInputs: FetchedInput<AddClassSchema>[], batchInputs: FetchedBatch[]) {
    this.schemaInputs = schemaInputs
    this.batchInputs = batchInputs
  }

  private schemaByEntityBatchFilename(entityBatchFilename: string) {
    const foundSchema = this.schemaInputs.find(
      ({ fileName: schemaFilename }) => schemaFilename.replace('Schema.json', 'Batch.json') === entityBatchFilename
    )
    if (!foundSchema) {
      throw new Error(`Related schema not found for entity batch: ${entityBatchFilename}`)
    }

    return foundSchema.data
  }

  private schemaByClassId(classId: number) {
    const foundSchema = this.schemaInputs.find(({ fileName }) => parseInt(fileName.split('_')[0]) === classId)
    if (!foundSchema) {
      throw new Error(`Schema not found by class id: ${classId}`)
    }

    return foundSchema.data
  }

  private getRefEntitySchema(parentEntitySchema: AddClassSchema, propName: string) {
    const refProp = parentEntitySchema.newProperties.find((p) => p.name === propName)
    if (!refProp) {
      throw new Error(`findRefEntitySchema: Property ${propName} not found in class ${parentEntitySchema.classId}`)
    }
    const refClassId = parseInt(
      createType('PropertyType', refProp.property_type).asType('Single').asType('Reference')[0].toString()
    )
    return this.schemaByClassId(refClassId)
  }

  private getUniqueQueryHash(uniquePropVal: Record<string, any>, classId: number) {
    return blake2AsHex(JSON.stringify([classId, uniquePropVal]))
  }

  private findEntityIndexByUniqueQuery(uniquePropVal: Record<string, any>, classId: number) {
    const hash = this.getUniqueQueryHash(uniquePropVal, classId)
    const foundIndex = this.entityIndexByUniqueQueryMap.get(hash)
    if (foundIndex === undefined) {
      throw new Error(
        `findEntityIndexByUniqueQuery failed for class ${classId} and query: ${JSON.stringify(uniquePropVal)}`
      )
    }

    return foundIndex
  }

  private parseEntityInput(entityInput: Record<string, any>, schema: AddClassSchema) {
    const parametrizedPropertyValues = Object.entries(entityInput).map(([propertyName, propertyValue]) => {
      const schemaPropertyIndex = schema.newProperties.findIndex((p) => p.name === propertyName)
      const schemaPropertyType = createType('PropertyType', schema.newProperties[schemaPropertyIndex].property_type)

      let value: ParametrizedPropertyValue

      // Handle references
      if (schemaPropertyType.isOfType('Single') && schemaPropertyType.asType('Single').isOfType('Reference')) {
        const refEntitySchema = this.getRefEntitySchema(schema, propertyName)
        let entityIndex: number
        if (Object.keys(propertyValue).includes('new')) {
          entityIndex = this.parseEntityInput(propertyValue.new, refEntitySchema)
        } else if (Object.keys(propertyValue).includes('existing')) {
          entityIndex = this.findEntityIndexByUniqueQuery(propertyValue.existing, refEntitySchema.classId)
        } else {
          throw new Error(`Invalid reference property value: ${JSON.stringify(propertyValue)}`)
        }
        value = createType('ParametrizedPropertyValue', { InternalEntityJustAdded: entityIndex })
      } else {
        value = createType('ParametrizedPropertyValue', {
          InputPropertyValue: schemaPropertyType.toInputPropertyValue(propertyValue).toJSON(),
        })
      }

      return {
        in_class_index: schemaPropertyIndex,
        value: value.toJSON(),
      }
    })

    // Add operations
    const createEntityOperationIndex = this.operations.length
    this.operations.push(createType('OperationType', { CreateEntity: { class_id: schema.classId } }))
    this.operations.push(
      createType('OperationType', {
        AddSchemaSupportToEntity: {
          schema_id: 0,
          entity_id: { InternalEntityJustAdded: createEntityOperationIndex },
          parametrized_property_values: parametrizedPropertyValues,
        },
      })
    )

    // Add entries to entityIndexByUniqueQueryMap
    schema.newProperties
      .filter((p) => p.unique)
      .forEach(({ name }) => {
        const hash = this.getUniqueQueryHash({ [name]: entityInput[name] }, schema.classId)
        this.entityIndexByUniqueQueryMap.set(hash, createEntityOperationIndex)
      })

    // Return CreateEntity operation index
    return createEntityOperationIndex
  }

  private reset() {
    this.entityIndexByUniqueQueryMap = new Map<string, number>()
    this.operations = []
  }

  public getOperations() {
    this.batchInputs.forEach(({ fileName: batchFilename, data: batch }) => {
      const entitySchema = this.schemaByEntityBatchFilename(batchFilename)
      batch.forEach((entityInput) => this.parseEntityInput(entityInput, entitySchema))
    })

    const operations = this.operations
    this.reset()

    return operations
  }
}
