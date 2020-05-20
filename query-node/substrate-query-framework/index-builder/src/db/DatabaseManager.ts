import { FindOneOptions, DeepPartial, EntityManager } from 'typeorm';

import { DB } from '.';
import { SubstrateEvent } from '..';
import * as helper from './helper';

/**
 * Database access object based on typeorm. Use typeorm transactional entity manager to perform get/save/remove
 * database operations.
 *
 * @constructor(event: QueryEvent, manager: EntityManager)
 *
 */
export default class DatabaseManager implements DB {
  // Transactional entity manager
  private readonly _manager: EntityManager;

  readonly event: SubstrateEvent;

  constructor(event: SubstrateEvent, manager: EntityManager) {
    this._manager = manager;
    this.event = event;
  }

  async save<T>(entity: DeepPartial<T>): Promise<void> {
    entity = helper.fillRequiredWarthogFields(entity);
    await this._manager.save(entity);
  }

  async remove<T>(entity: DeepPartial<T>): Promise<void> {
    await this._manager.remove(entity);
  }

  async get<T>(entity: { new (...args: any[]): T }, options: FindOneOptions<T>): Promise<T | undefined> {
    return await this._manager.findOne(entity, options);
  }
}
