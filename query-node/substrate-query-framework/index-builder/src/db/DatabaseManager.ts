import { FindOneOptions, DeepPartial, EntityManager } from 'typeorm';

import * as helper from './helper';

/**
 * Database access interface. Use typeorm transactional entity manager to perform get/save/remove operations.
 */
export default interface DatabaseManager {
  /**
   * Save given entity instance, if entity is exists then just update
   * @param entity
   */
  save<T>(entity: DeepPartial<T>): Promise<void>;

  /**
   * Removes a given entity from the database.
   * @param entity: DeepPartial<T>
   */
  remove<T>(entity: DeepPartial<T>): Promise<void>;

  /**
   * Finds first entity that matches given options.
   * @param entity: T
   * @param options: FindOneOptions<T>
   */
  get<T>(entity: { new (...args: any[]): T }, options: FindOneOptions<T>): Promise<T | undefined>;
}

/**
 * Create database manager.
 * @param entityManager EntityManager
 */
export function makeDatabaseManager(entityManager: EntityManager): DatabaseManager {
  return {
    save: async <T>(entity: DeepPartial<T>): Promise<void> => {
      entity = helper.fillRequiredWarthogFields(entity);
      await entityManager.save(entity);
    },
    remove: async <T>(entity: DeepPartial<T>): Promise<void> => {
      await entityManager.remove(entity);
    },
    get: async <T>(entity: { new (...args: any[]): T }, options: FindOneOptions<T>): Promise<T | undefined> => {
      return await entityManager.findOne(entity, options);
    },
  } as DatabaseManager;
}
