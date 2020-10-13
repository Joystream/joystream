import { AddClassSchema, Property } from '../../types/extrinsics/AddClassSchema'
import { createType } from '@joystream/types'
import { blake2AsHex } from '@polkadot/util-crypto'
import {
  ClassId,
  OperationType,
  ParametrizedPropertyValue,
  PropertyId,
  PropertyType,
  EntityId,
  Entity,
  ParametrizedClassPropertyValue,
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
  private entityIdByUniqueQueryMap = new Map<string, number>()
  private entityByUniqueQueryCurrentIndex = 0
  private classIdByNameMap = new Map<string, number>()
  private classMapInitialized = false
  private entityIdByUniqueQueryMapInitialized = false

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

  // Initialize entityIdByUniqueQueryMap with entities fetched from the chain
  private async initializeEntityIdByUniqueQueryMap() {
    if (this.entityIdByUniqueQueryMapInitialized) {
      return
    }

    await this.initializeClassMap() // Initialize if not yet initialized

    // Get entity entries
    const entityEntries: [EntityId, Entity][] = (
      await this.api.query.contentDirectory.entityById.entries()
    ).map(([storageKey, entity]) => [storageKey.args[0] as EntityId, entity])

    entityEntries.forEach(([entityId, entity]) => {
      const classId = entity.class_id.toNumber()
      const className = Array.from(this.classIdByNameMap.entries()).find(([, id]) => id === classId)?.[0]
      if (!className) {
        // Class not found - skip
        return
      }
      let schema: AddClassSchema
      try {
        schema = this.schemaByClassName(className)
      } catch (e) {
        // Input schema not found - skip
        return
      }
      const valuesEntries = Array.from(entity.getField('values').entries())
      schema.newProperties.forEach(({ name, unique }, index) => {
        if (!unique) {
          return // Skip non-unique properties
        }
        const storedValue = valuesEntries.find(([propertyId]) => propertyId.toNumber() === index)?.[1]
        if (
          storedValue === undefined ||
          // If unique value is Bool, it's almost definitely empty, so we skip it
          (storedValue.isOfType('Single') && storedValue.asType('Single').isOfType('Bool'))
        ) {
          // Skip empty values (not all unique properties are required)
          return
        }
        const simpleValue = storedValue.getValue().toJSON()
        const hash = this.getUniqueQueryHash({ [name]: simpleValue }, schema.className)
        this.entityIdByUniqueQueryMap.set(hash, entityId.toNumber())
      })
    })

    this.entityIdByUniqueQueryMapInitialized = true
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

  // Seatch for entity by { [uniquePropName]: [uniquePropVal] } on chain
  async findEntityIdByUniqueQuery(uniquePropVal: Record<string, any>, className: string): Promise<number> {
    await this.initializeEntityIdByUniqueQueryMap()
    const hash = this.getUniqueQueryHash(uniquePropVal, className)
    const foundId = this.entityIdByUniqueQueryMap.get(hash)
    if (foundId === undefined) {
      throw new Error(
        `findEntityIdByUniqueQuery failed for class ${className} and query: ${JSON.stringify(uniquePropVal)}`
      )
    }

    return foundId
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

  private async createParametrizedPropertyValues(
    entityInput: Record<string, any>,
    schema: AddClassSchema,
    customHandler?: (property: Property, value: any) => Promise<ParametrizedPropertyValue | undefined>
  ): Promise<ParametrizedClassPropertyValue[]> {
    const filteredInput = Object.entries(entityInput).filter(([, pValue]) => pValue !== undefined)
    const parametrizedClassPropValues: ParametrizedClassPropertyValue[] = []

    for (const [propertyName, propertyValue] of filteredInput) {
      const schemaPropertyIndex = schema.newProperties.findIndex((p) => p.name === propertyName)
      const schemaProperty = schema.newProperties[schemaPropertyIndex]

      let value = customHandler && (await customHandler(schemaProperty, propertyValue))
      if (value === undefined) {
        value = createType('ParametrizedPropertyValue', {
          InputPropertyValue: this.parsePropertyType(schemaProperty.property_type)
            .toInputPropertyValue(propertyValue)
            .toJSON() as any,
        })
      }

      parametrizedClassPropValues.push(
        createType('ParametrizedClassPropertyValue', {
          in_class_index: schemaPropertyIndex,
          value: value.toJSON() as any,
        })
      )
    }

    return parametrizedClassPropValues
  }

  private async parseEntityInput(entityInput: Record<string, any>, schema: AddClassSchema) {
    const parametrizedPropertyValues = await this.createParametrizedPropertyValues(
      entityInput,
      schema,
      async (property, value) => {
        // Custom handler for references
        const { property_type: propertyType } = property
        if (isSingle(propertyType) && isReference(propertyType.Single)) {
          const refEntitySchema = this.schemaByClassName(propertyType.Single.Reference.className)
          if (Object.keys(value).includes('new')) {
            const entityIndex = await this.parseEntityInput(value.new, refEntitySchema)
            return createType('ParametrizedPropertyValue', { InternalEntityJustAdded: entityIndex })
          } else if (Object.keys(value).includes('existing')) {
            try {
              const entityIndex = this.findEntityIndexByUniqueQuery(value.existing, refEntitySchema.className)
              return createType('ParametrizedPropertyValue', { InternalEntityJustAdded: entityIndex })
            } catch (e) {
              // Fallback to chain search
              const entityId = await this.findEntityIdByUniqueQuery(value.existing, refEntitySchema.className)
              return createType('ParametrizedPropertyValue', {
                InputPropertyValue: { Single: { Reference: entityId } },
              })
            }
          }
        }
        return undefined
      }
    )

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
    for (const batch of this.batchInputs) {
      const entitySchema = this.schemaByClassName(batch.className)
      for (const entityInput of batch.entries) {
        await this.parseEntityInput(entityInput, entitySchema)
      }
    }

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
    const parametrizedPropertyValues = await this.createParametrizedPropertyValues(entityInput, schema)

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
