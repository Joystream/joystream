import { FindOneOptions, DeepPartial } from 'typeorm';

import { SubstrateEvent } from '..';

/**
 * Database interaction interface.
 */
export default interface DB {
  /**
   * The runtime event that attached to provide event data for database operation
   */
  readonly event: SubstrateEvent;

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
