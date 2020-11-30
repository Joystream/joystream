import ExitCodes from '../ExitCodes'
import { WorkingGroups } from '../Types'
import { ReferenceProperty } from '@joystream/cd-schemas/types/extrinsics/AddClassSchema'
import { FlattenRelations } from '@joystream/cd-schemas/types/utility'
import { BOOL_PROMPT_OPTIONS } from '../helpers/prompting'
import {
  Class,
  ClassId,
  CuratorGroup,
  CuratorGroupId,
  Entity,
  EntityId,
  Actor,
  PropertyType,
} from '@joystream/types/content-directory'
import { Worker } from '@joystream/types/working-group'
import { CLIError } from '@oclif/errors'
import { Codec } from '@polkadot/types/types'
import AbstractInt from '@polkadot/types/codec/AbstractInt'
import { AnyJson } from '@polkadot/types/types/helpers'
import _ from 'lodash'
import { RolesCommandBase } from './WorkingGroupsCommandBase'
import { createType } from '@joystream/types'
import chalk from 'chalk'
import { flags } from '@oclif/command'

const CONTEXTS = ['Member', 'Curator', 'Lead'] as const
type Context = typeof CONTEXTS[number]

type ParsedPropertyValue = { value: Codec | null; type: PropertyType['type']; subtype: PropertyType['subtype'] }

/**
 * Abstract base class for commands related to content directory
 */
export default abstract class ContentDirectoryCommandBase extends RolesCommandBase {
  group = WorkingGroups.Curators // override group for RolesCommandBase

  static contextFlag = flags.enum({
    name: 'context',
    required: false,
    description: `Actor context to execute the command in (${CONTEXTS.join('/')})`,
    options: [...CONTEXTS],
  })

  async promptForContext(message = 'Choose in which context you wish to execute the command'): Promise<Context> {
    return this.simplePrompt({
      message,
      type: 'list',
      choices: CONTEXTS.map((c) => ({ name: c, value: c })),
    })
  }

  // Use when lead access is required in given command
  async requireLead(): Promise<void> {
    await this.getRequiredLead()
  }

  async getCuratorContext(classNames: string[] = []): Promise<Actor> {
    const curator = await this.getRequiredWorker()
    const classes = await Promise.all(classNames.map(async (cName) => (await this.classEntryByNameOrId(cName))[1]))
    const classMaintainers = classes.map(({ class_permissions: permissions }) => permissions.maintainers.toArray())

    const groups = await this.getApi().availableCuratorGroups()
    const availableGroupIds = groups
      .filter(
        ([groupId, group]) =>
          group.active.valueOf() &&
          classMaintainers.every((maintainers) => maintainers.some((m) => m.eq(groupId))) &&
          group.curators.toArray().some((curatorId) => curatorId.eq(curator.workerId))
      )
      .map(([id]) => id)

    let groupId: number
    if (!availableGroupIds.length) {
      this.error(
        'You do not have the required maintainer access to at least one of the following classes: ' +
          classNames.join(', '),
        { exit: ExitCodes.AccessDenied }
      )
    } else if (availableGroupIds.length === 1) {
      groupId = availableGroupIds[0].toNumber()
    } else {
      groupId = await this.promptForCuratorGroup('Select Curator Group context', availableGroupIds)
    }

    return createType('Actor', { Curator: [groupId, curator.workerId.toNumber()] })
  }

  async promptForClass(message = 'Select a class'): Promise<Class> {
    const classes = await this.getApi().availableClasses()
    const choices = classes.map(([, c]) => ({ name: c.name.toString(), value: c }))
    if (!choices.length) {
      this.warn('No classes exist to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }

    const selectedClass = await this.simplePrompt({ message, type: 'list', choices })

    return selectedClass
  }

  async classEntryByNameOrId(classNameOrId: string): Promise<[ClassId, Class]> {
    const classes = await this.getApi().availableClasses()
    const foundClass = classes.find(([id, c]) => id.toString() === classNameOrId || c.name.toString() === classNameOrId)
    if (!foundClass) {
      this.error(`Class id not found by class name or id: "${classNameOrId}"!`)
    }

    return foundClass
  }

  private async curatorGroupChoices(ids?: CuratorGroupId[]) {
    const groups = await this.getApi().availableCuratorGroups()
    return groups
      .filter(([id]) => (ids ? ids.some((allowedId) => allowedId.eq(id)) : true))
      .map(([id, group]) => ({
        name:
          `Group ${id.toString()} (` +
          `${group.active.valueOf() ? 'Active' : 'Inactive'}, ` +
          `${group.curators.toArray().length} member(s), ` +
          `${group.number_of_classes_maintained.toNumber()} classes maintained)`,
        value: id.toNumber(),
      }))
  }

  async promptForCuratorGroup(message = 'Select a Curator Group', ids?: CuratorGroupId[]): Promise<number> {
    const choices = await this.curatorGroupChoices(ids)
    if (!choices.length) {
      this.warn('No Curator Groups to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }
    const selectedId = await this.simplePrompt({ message, type: 'list', choices })

    return selectedId
  }

  async promptForCuratorGroups(message = 'Select Curator Groups'): Promise<number[]> {
    const choices = await this.curatorGroupChoices()
    if (!choices.length) {
      return []
    }
    const selectedIds = await this.simplePrompt({ message, type: 'checkbox', choices })

    return selectedIds
  }

  async promptForClassReference(): Promise<ReferenceProperty['Reference']> {
    const selectedClass = await this.promptForClass()
    const sameOwner = await this.simplePrompt({ message: 'Same owner required?', ...BOOL_PROMPT_OPTIONS })
    return { className: selectedClass.name.toString(), sameOwner }
  }

  async promptForCurator(message = 'Choose a Curator', ids?: number[]): Promise<number> {
    const curators = await this.getApi().groupMembers(WorkingGroups.Curators)
    const choices = curators
      .filter((c) => (ids ? ids.includes(c.workerId.toNumber()) : true))
      .map((c) => ({
        name: `${c.profile.handle.toString()} (Worker ID: ${c.workerId})`,
        value: c.workerId.toNumber(),
      }))

    if (!choices.length) {
      this.warn('No Curators to choose from!')
      this.exit(ExitCodes.InvalidInput)
    }

    const selectedCuratorId = await this.simplePrompt({
      message,
      type: 'list',
      choices,
    })

    return selectedCuratorId
  }

  async getCurator(id: string | number): Promise<Worker> {
    if (typeof id === 'string') {
      id = parseInt(id)
    }

    let curator
    try {
      curator = await this.getApi().workerByWorkerId(WorkingGroups.Curators, id)
    } catch (e) {
      if (e instanceof CLIError) {
        throw new CLIError('Invalid Curator id!')
      }
      throw e
    }

    return curator
  }

  async getCuratorGroup(id: string | number): Promise<CuratorGroup> {
    if (typeof id === 'string') {
      id = parseInt(id)
    }

    const group = await this.getApi().curatorGroupById(id)

    if (!group) {
      this.error('Invalid Curator Group id!', { exit: ExitCodes.InvalidInput })
    }

    return group
  }

  async getEntity(
    id: string | number,
    requiredClass?: string,
    ownerMemberId?: number,
    requireSchema = true
  ): Promise<Entity> {
    if (typeof id === 'string') {
      id = parseInt(id)
    }

    const entity = await this.getApi().entityById(id)

    if (!entity) {
      this.error(`Entity not found by id: ${id}`, { exit: ExitCodes.InvalidInput })
    }

    if (requiredClass) {
      const [classId] = await this.classEntryByNameOrId(requiredClass)
      if (entity.class_id.toNumber() !== classId.toNumber()) {
        this.error(`Entity of id ${id} is not of class ${requiredClass}!`, { exit: ExitCodes.InvalidInput })
      }
    }

    const { controller } = entity.entity_permissions
    if (
      ownerMemberId !== undefined &&
      (!controller.isOfType('Member') || controller.asType('Member').toNumber() !== ownerMemberId)
    ) {
      this.error('Cannot execute this action for specified entity - invalid ownership.', {
        exit: ExitCodes.AccessDenied,
      })
    }

    if (requireSchema && !entity.supported_schemas.toArray().length) {
      this.error(`${requiredClass || ''} entity of id ${id} has no schema support added!`)
    }

    return entity
  }

  async getAndParseKnownEntity<T>(id: string | number, className?: string): Promise<FlattenRelations<T>> {
    const entity = await this.getEntity(id, className)
    return this.parseToKnownEntityJson<T>(entity)
  }

  async entitiesByClassAndOwner(classNameOrId: number | string, ownerMemberId?: number): Promise<[EntityId, Entity][]> {
    const classId =
      typeof classNameOrId === 'number' ? classNameOrId : (await this.classEntryByNameOrId(classNameOrId))[0].toNumber()

    return (await this.getApi().entitiesByClassId(classId)).filter(([, entity]) => {
      const controller = entity.entity_permissions.controller
      return ownerMemberId !== undefined
        ? controller.isOfType('Member') && controller.asType('Member').toNumber() === ownerMemberId
        : true
    })
  }

  async promptForEntityEntry(
    message: string,
    className: string,
    propName?: string,
    ownerMemberId?: number,
    defaultId?: number | null
  ): Promise<[EntityId, Entity]> {
    const [classId, entityClass] = await this.classEntryByNameOrId(className)
    const entityEntries = await this.entitiesByClassAndOwner(classId.toNumber(), ownerMemberId)

    if (!entityEntries.length) {
      this.log(`${message}:`)
      this.error(`No choices available! Exiting...`, { exit: ExitCodes.UnexpectedException })
    }

    const choosenEntityId = await this.simplePrompt({
      message,
      type: 'list',
      choices: entityEntries.map(([id, entity]) => {
        const parsedEntityPropertyValues = this.parseEntityPropertyValues(entity, entityClass)
        return {
          name: (propName && parsedEntityPropertyValues[propName]?.value?.toString()) || `ID:${id.toString()}`,
          value: id.toString(), // With numbers there are issues with "default"
        }
      }),
      default: typeof defaultId === 'number' ? defaultId.toString() : undefined,
    })

    return entityEntries.find(([id]) => choosenEntityId === id.toString())!
  }

  async promptForEntityId(
    message: string,
    className: string,
    propName?: string,
    ownerMemberId?: number,
    defaultId?: number | null
  ): Promise<number> {
    return (await this.promptForEntityEntry(message, className, propName, ownerMemberId, defaultId))[0].toNumber()
  }

  parseStoredPropertyInnerValue(value: Codec | null): AnyJson {
    if (value === null) {
      return null
    }

    if (value instanceof AbstractInt) {
      return value.toNumber() // Integers (signed ones) are by default converted to hex when using .toJson()
    }

    return value.toJSON()
  }

  parseEntityPropertyValues(
    entity: Entity,
    entityClass: Class,
    includedProperties?: string[]
  ): Record<string, ParsedPropertyValue> {
    const { properties } = entityClass
    return Array.from(entity.getField('values').entries()).reduce((columns, [propId, propValue]) => {
      const prop = properties[propId.toNumber()]
      const propName = prop.name.toString()
      const included = !includedProperties || includedProperties.some((p) => p.toLowerCase() === propName.toLowerCase())
      const { type: propType, subtype: propSubtype } = prop.property_type

      if (included) {
        columns[propName] = {
          // If type doesn't match (Boolean(false) for optional fields case) - use "null" as value
          value: propType !== propValue.type || propSubtype !== propValue.subtype ? null : propValue.getValue(),
          type: propType,
          subtype: propSubtype,
        }
      }
      return columns
    }, {} as Record<string, ParsedPropertyValue>)
  }

  async parseToKnownEntityJson<T>(entity: Entity): Promise<FlattenRelations<T>> {
    const entityClass = (await this.classEntryByNameOrId(entity.class_id.toString()))[1]
    return (_.mapValues(this.parseEntityPropertyValues(entity, entityClass), (v) =>
      this.parseStoredPropertyInnerValue(v.value)
    ) as unknown) as FlattenRelations<T>
  }

  async createEntityList(
    className: string,
    includedProps?: string[],
    filters: [string, string][] = [],
    ownerMemberId?: number
  ): Promise<Record<string, string>[]> {
    const [classId, entityClass] = await this.classEntryByNameOrId(className)
    // Create object of default "[not set]" values (prevents breaking the table if entity has no schema support)
    const defaultValues = entityClass.properties
      .map((p) => p.name.toString())
      .reduce((d, propName) => {
        if (!includedProps || includedProps.includes(propName)) {
          d[propName] = chalk.grey('[not set]')
        }
        return d
      }, {} as Record<string, string>)

    const entityEntries = await this.entitiesByClassAndOwner(classId.toNumber(), ownerMemberId)
    const parsedEntities = (await Promise.all(
      entityEntries.map(([id, entity]) => ({
        'ID': id.toString(),
        ...defaultValues,
        ..._.mapValues(this.parseEntityPropertyValues(entity, entityClass, includedProps), (v) =>
          v.value === null ? chalk.grey('[not set]') : v.value.toString()
        ),
      }))
    )) as Record<string, string>[]

    return parsedEntities.filter((entity) => filters.every(([pName, pValue]) => entity[pName] === pValue))
  }
}
