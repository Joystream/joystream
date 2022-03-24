import { DatabaseManager } from '@joystream/hydra-common'
import { IExecutor, IListener, IDerivedPropertiesManager } from './interfaces'
import { EntityType } from '../common'

interface IListenerWithExecutors<Entity, Change> {
  listener: IListener<Entity, Change>
  executors: IExecutor<unknown, Change, unknown>[]
}

export class DerivedPropertiesManager<Entity extends { id: string }, Change>
  implements IDerivedPropertiesManager<Entity, Change> {
  private store: DatabaseManager
  private listeners: IListenerWithExecutors<Entity, Change>[] = []
  private entityType: EntityType<Entity>
  private defaultRelations: string[] = []

  constructor(store: DatabaseManager, entityType: EntityType<Entity>, extraDefaultRelations: string[] = []) {
    this.store = store
    this.entityType = entityType
    this.defaultRelations = extraDefaultRelations
  }

  /// /////////////// IDerivedPropertiesManager ////////////////////////////////

  registerListener(listener: IListener<Entity, Change>, executors: IExecutor<unknown, Change, unknown>[]): void {
    this.listeners.push({
      listener,
      executors,
    })
    this.defaultRelations = this.defaultRelations.concat(listener.getRelationDependencies())
  }

  async onMainEntityCreation(entity: Entity): Promise<void> {
    for (let i = 0; i < this.listeners.length; i++) {
      await this.handleListener(undefined, entity, this.listeners[i])
    }
  }

  async onMainEntityUpdate(newEntity: Entity, initialEntity?: Entity): Promise<void> {
    const oldEntity =
      initialEntity ||
      (await this.store.get(this.entityType, { where: { id: newEntity.id }, relations: this.defaultRelations }))

    for (let i = 0; i < this.listeners.length; i++) {
      await this.handleListener(oldEntity, newEntity, this.listeners[i])
    }
  }

  async onMainEntityDeletion(initialEntity: Entity): Promise<void> {
    for (let i = 0; i < this.listeners.length; i++) {
      await this.handleListener(initialEntity, undefined, this.listeners[i])
    }
  }

  /// /////////////// Utils ////////////////////////////////////////////////////
  private async handleListener(
    oldEntity: Entity | undefined,
    newEntity: Entity,
    listener: IListenerWithExecutors<Entity, Change>
  ): Promise<void>

  private async handleListener(
    oldEntity: Entity,
    newEntity: Entity | undefined,
    listener: IListenerWithExecutors<Entity, Change>
  ): Promise<void>

  private async handleListener(
    oldEntity: Entity,
    newEntity: Entity,
    listener: IListenerWithExecutors<Entity, Change>
  ): Promise<void> {
    const changePair = listener.listener.hasValueChanged(oldEntity, newEntity)

    if (typeof changePair === 'undefined') {
      return
    }

    if (oldEntity && typeof changePair.old !== 'undefined') {
      await this.callExecutors('updateOldValue', listener, oldEntity, changePair.old)
    }

    if (newEntity && typeof changePair.new !== 'undefined') {
      await this.callExecutors('updateNewValue', listener, newEntity, changePair.new)
    }
  }

  private async callExecutors(
    listenerMethod: 'updateOldValue' | 'updateNewValue',
    listener: IListenerWithExecutors<Entity, Change>,
    value: Entity,
    change: Change
  ): Promise<void> {
    for (let i = 0; i < listener.executors.length; i++) {
      const executor = listener.executors[i]

      const dependencies = await executor.loadDerivedEntities(this.store, value)
      if (!dependencies.length) {
        continue
      }

      const changedDependencies = dependencies.map((dependency) => executor[listenerMethod](dependency, change))

      await executor.saveDerivedEntities(this.store, changedDependencies)
    }
  }
}
