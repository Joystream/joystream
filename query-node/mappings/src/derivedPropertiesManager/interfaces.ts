import { DatabaseManager } from '@joystream/hydra-common'

export type IChangePair<Change> = {
  old: Change | undefined
  new: Change | undefined
}

export interface IListener<Entity, Change> {
  getRelationDependencies(): string[]
  hasValueChanged(oldValue: Entity, newValue: Entity): IChangePair<Change> | undefined
  hasValueChanged(oldValue: Entity | undefined, newValue: Entity): IChangePair<Change> | undefined
  hasValueChanged(oldValue: Entity, newValue: Entity | undefined): IChangePair<Change> | undefined
}

export interface IExecutor<Entity, Change, DerivedEntity> {
  loadDerivedEntities(store: DatabaseManager, entity: Entity): Promise<DerivedEntity[]>
  saveDerivedEntities(store: DatabaseManager, entities: DerivedEntity[]): Promise<void>
  updateOldValue(entity: DerivedEntity, change: Change): DerivedEntity
  updateNewValue(entity: DerivedEntity, change: Change): DerivedEntity
}

export interface IDerivedPropertiesManager<Entity, Change> {
  registerListener(listener: IListener<Entity, Change>, executors: IExecutor<unknown, Change, unknown>[]): void
  onMainEntityCreation(entity: Entity): Promise<void>
  onMainEntityUpdate(newEntity: Entity): Promise<void>
  onMainEntityUpdate(initialEntity: Entity, newEntity: Entity): Promise<void>
  onMainEntityDeletion(initialEntity: Entity): Promise<void>
}
