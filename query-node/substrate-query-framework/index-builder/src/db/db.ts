import { FindOneOptions, DeepPartial, EntityManager } from 'typeorm';

import { JoyEvent } from '..';
import * as helper from './helper';

/**
 * Database access object based on typeorm. Use typeorm transactional entity manager to perform get/save/remove
 * database operations.
 *
 * @constructor(event: QueryEvent, manager: EntityManager)
 *
 */
export default class DB {
  // Transactional entity manager
  private readonly _manager: EntityManager;

  // Runtime event
  private readonly _event: JoyEvent;

  constructor(event: JoyEvent, manager: EntityManager) {
    this._manager = manager;
    this._event = event;
  }

  get event(): JoyEvent {
    return this._event;
  }

  /**
   * Save given entity instance, if entity is exists then just update
   * @param entity
   */
  async save<T>(entity: DeepPartial<T>): Promise<void> {
    entity = helper.fillRequiredWarthogFields(entity);
    await this._manager.save(entity);
  }

  /**
   * Removes a given entity from the database.
   * @param entity: DeepPartial<T>
   */
  async remove<T>(entity: DeepPartial<T>) {
    await this._manager.remove(entity);
  }

  /**
   * Finds first entity that matches given options.
   * @param entity: T
   * @param options: FindOneOptions<T>
   */
  async get<T>(entity: { new (...args: any[]): T }, options: FindOneOptions<T>): Promise<T | undefined> {
    return await this._manager.findOne(entity, options);
  }
}
