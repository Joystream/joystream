import { AddClassSchema, Property } from '../../types/extrinsics/AddClassSchema'
import { createType } from '@joystream/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import {
  ClassId,
  OperationType,
  ParametrizedPropertyValue,
  PropertyId,
  PropertyType,
} from '@joystream/types/content-directory'
import { isSingle, isReference } from './propertyType'
import { ApiPromise } from '@polkadot/api'
import { JoyBTreeSet } from '@joystream/types/common'
import { CreateClass } from '../../types/extrinsics/CreateClass'
import { EntityBatch } from '../../types/EntityBatch'
import { getInputs } from './inputs'

export class InputParser {
  private api: ApiPromise
  private classInputs: CreateClass[]
  private schemaInputs: AddClassSchema[]
  private batchInputs: EntityBatch[]
  private createEntityOperations: OperationType[] = []
  private addSchemaToEntityOprations: OperationType[] = []
  private entityIndexByUniqueQueryMap = new Map<string, number>()
  private entityByUniqueQueryCurrentIndex = 0
  private classIdByNameMap = new Map<string, number>()
  private classMapInitialized = false

  static createWithKnownSchemas(api: ApiPromise, entityBatches?: EntityBatch[]) {
    return new InputParser(
      api,
      [],
      getInputs('schemas').map(({ data }) => data),
      entityBatches
    )
  }

  constructor(
    api: ApiPromise,
    classInputs?: CreateClass[],
    schemaInputs?: AddClassSchema[],
    batchInputs?: EntityBatch[]
  ) {
    this.api = api
    this.classInputs = classInputs || []
    this.schemaInputs = schemaInputs || []
    this.batchInputs = batchInputs || []
  }

  private async initializeClassMap() {
    if (this.classMapInitialized) {
      return
    }
    const classEntries = await this.api.query.contentDirectory.classById.entries()
    classEntries.forEach(([key, aClass]) => {
      this.classIdByNameMap.set(aClass.name.toString(), (key.args[0] as ClassId).toNumber())
    })
    this.classMapInitialized = true
  }

  private schemaByClassName(className: string) {
    const foundSchema = this.schemaInputs.find((data) => data.className === className)
    if (!foundSchema) {
      throw new Error(`Schema not found by class name: ${className}`)
    }

    return foundSchema
  }

  private getUniqueQueryHash(uniquePropVal: Record<string, any>, className: string) {
    return blake2AsHex(JSON.stringify([className, uniquePropVal]))
  }

  private findEntityIndexByUniqueQuery(uniquePropVal: Record<string, any>, className: string) {
    const hash = this.getUniqueQueryHash(uniquePropVal, className)
    const foundIndex = this.entityIndexByUniqueQueryMap.get(hash)
    if (foundIndex === undefined) {
      throw new Error(
        `findEntityIndexByUniqueQuery failed for class ${className} and query: ${JSON.stringify(uniquePropVal)}`
      )
    }

    return foundIndex
  }

  private getClassIdByName(className: string): number {
    const classId = this.classIdByNameMap.get(className)
    if (classId === undefined) {
      throw new Error(`Could not find class id by name: "${className}"!`)
    }
    return classId
  }

  private parsePropertyType(propertyType: Property['property_type']): PropertyType {
    if (isSingle(propertyType) && isReference(propertyType.Single)) {
      const { className, sameOwner } = propertyType.Single.Reference
      const classId = this.getClassIdByName(className)
      return createType('PropertyType', { Single: { Reference: [classId, sameOwner] } })
    }
    // Types other than reference are fully compatible
    return createType('PropertyType', propertyType)
  }

  private includeEntityInputInUniqueQueryMap(entityInput: Record<string, any>, schema: AddClassSchema) {
    Object.entries(entityInput)
      .filter(([, pValue]) => pValue !== undefined)
      .forEach(([propertyName, propertyValue]) => {
        const schemaPropertyType = schema.newProperties.find((p) => p.name === propertyName)!.property_type
        // Handle entities "nested" via "new"
        if (isSingle(schemaPropertyType) && isReference(schemaPropertyType.Single)) {
          if (Object.keys(propertyValue).includes('new')) {
            const refEntitySchema = this.schemaByClassName(schemaPropertyType.Single.Reference.className)
            this.includeEntityInputInUniqueQueryMap(propertyValue.new, refEntitySchema)
          }
        }
      })
    // Add entries to entityIndexByUniqueQueryMap
    schema.newProperties
      .filter((p) => p.unique)
      .forEach(({ name }) => {
        if (entityInput[name] === undefined) {
          // Skip empty values (not all unique properties are required)
          return
        }
        const hash = this.getUniqueQueryHash({ [name]: entityInput[name] }, schema.className)
        this.entityIndexByUniqueQueryMap.set(hash, this.entityByUniqueQueryCurrentIndex)
      })
    ++this.entityByUniqueQueryCurrentIndex
  }

  private createParametrizedPropertyValues(
    entityInput: Record<string, any>,
    schema: AddClassSchema,
    customHandler?: (property: Property, value: any) => ParametrizedPropertyValue | undefined
  ) {
    return Object.entries(entityInput)
      .filter(([, pValue]) => pValue !== undefined)
      .map(([propertyName, propertyValue]) => {
        const schemaPropertyIndex = schema.newProperties.findIndex((p) => p.name === propertyName)
        const schemaProperty = schema.newProperties[schemaPropertyIndex]

        let value = customHandler && customHandler(schemaProperty, propertyValue)
        if (value === undefined) {
          value = createType('ParametrizedPropertyValue', {
            InputPropertyValue: this.parsePropertyType(schemaProperty.property_type).toInputPropertyValue(
              propertyValue
            ),
          })
        }

        return { in_class_index: schemaPropertyIndex, value }
      })
  }

  private parseEntityInput(entityInput: Record<string, any>, schema: AddClassSchema) {
    const parametrizedPropertyValues = this.createParametrizedPropertyValues(entityInput, schema, (property, value) => {
      // Custom handler for references
      const { property_type: propertyType } = property
      if (isSingle(propertyType) && isReference(propertyType.Single)) {
        const refEntitySchema = this.schemaByClassName(propertyType.Single.Reference.className)
        if (Object.keys(value).includes('new')) {
          const entityIndex = this.parseEntityInput(value.new, refEntitySchema)
          return createType('ParametrizedPropertyValue', { InternalEntityJustAdded: entityIndex })
        } else if (Object.keys(value).includes('existing')) {
          const entityIndex = this.findEntityIndexByUniqueQuery(value.existing, refEntitySchema.className)
          return createType('ParametrizedPropertyValue', { InternalEntityJustAdded: entityIndex })
        }
      }
      return undefined
    })

    // Add operations
    const createEntityOperationIndex = this.createEntityOperations.length
    const classId = this.classIdByNameMap.get(schema.className)
    this.createEntityOperations.push(createType('OperationType', { CreateEntity: { class_id: classId } }))
    this.addSchemaToEntityOprations.push(
      createType('OperationType', {
        AddSchemaSupportToEntity: {
          schema_id: 0,
          entity_id: { InternalEntityJustAdded: createEntityOperationIndex },
          parametrized_property_values: parametrizedPropertyValues,
        },
      })
    )

    // Return CreateEntity operation index
    return createEntityOperationIndex
  }

  private reset() {
    this.entityIndexByUniqueQueryMap = new Map<string, number>()
    this.classIdByNameMap = new Map<string, number>()
    this.createEntityOperations = []
    this.addSchemaToEntityOprations = []
    this.entityByUniqueQueryCurrentIndex = 0
  }

  public async getEntityBatchOperations() {
    await this.initializeClassMap()
    // First - create entityUniqueQueryMap to allow referencing any entity at any point
    this.batchInputs.forEach((batch) => {
      const entitySchema = this.schemaByClassName(batch.className)
      batch.entries.forEach((entityInput) => this.includeEntityInputInUniqueQueryMap(entityInput, entitySchema))
    })
    // Then - parse into actual operations
    this.batchInputs.forEach((batch) => {
      const entitySchema = this.schemaByClassName(batch.className)
      batch.entries.forEach((entityInput) => this.parseEntityInput(entityInput, entitySchema))
    })

    const operations = [...this.createEntityOperations, ...this.addSchemaToEntityOprations]
    this.reset()

    return operations
  }

  public async createEntityUpdateOperation(
    entityInput: Record<string, any>,
    className: string,
    entityId: number
  ): Promise<OperationType> {
    await this.initializeClassMap()
    const schema = this.schemaByClassName(className)
    const parametrizedPropertyValues = this.createParametrizedPropertyValues(entityInput, schema)

    return createType('OperationType', {
      UpdatePropertyValues: {
        entity_id: { ExistingEntity: entityId },
        new_parametrized_property_values: parametrizedPropertyValues,
      },
    })
  }

  public async parseAddClassSchemaExtrinsic(inputData: AddClassSchema) {
    await this.initializeClassMap() // Initialize if not yet initialized
    const classId = this.getClassIdByName(inputData.className)
    const newProperties = inputData.newProperties.map((p) => ({
      ...p,
      // Parse different format for Reference (and potentially other propTypes in the future)
      property_type: this.parsePropertyType(p.property_type).toJSON(),
    }))
    return this.api.tx.contentDirectory.addClassSchema(
      classId,
      new (JoyBTreeSet(PropertyId))(this.api.registry, inputData.existingProperties),
      newProperties
    )
  }

  public parseCreateClassExtrinsic(inputData: CreateClass) {
    return this.api.tx.contentDirectory.createClass(
      inputData.name,
      inputData.description,
      inputData.class_permissions || {},
      inputData.maximum_entities_count,
      inputData.default_entity_creation_voucher_upper_bound
    )
  }

  public async getAddSchemaExtrinsics() {
    return await Promise.all(this.schemaInputs.map((data) => this.parseAddClassSchemaExtrinsic(data)))
  }

  public getCreateClassExntrinsics() {
    return this.classInputs.map((data) => this.parseCreateClassExtrinsic(data))
  }
}
