import { Connection, FindOneOptions, DeepPartial, getConnection, QueryRunner } from 'typeorm';
import { SavedEntityEvent } from '.';
import { QueryEvent } from '..';
import * as helper from './helper';

/**
 * Database access object based on typeorm. Use typeorm database connection to run get/save/remove
 * methods on entities.
 * Generic get/save/remove methods are generic. Entitites registered to the typeorm connection
 * are valid entities for get/save/remove methods.
 *
 * @constructor(connection: typeorm.Connection)
 *
 */
export default class DB {
  private readonly _connection: Connection;
  private _event: QueryEvent;

  // Create and control state of single database connection
  private readonly _queryRunner!: QueryRunner;

  constructor(event: QueryEvent) {
    this._connection = getConnection();
    this._event = event;

    this._queryRunner = this._connection.createQueryRunner();
  }

  get event(): QueryEvent {
    return this._event;
  }

  set event(event: QueryEvent) {
    this._event = event;
  }

  /**
   * Save given entity instance, if entity is exists then just update
   * @param entity
   */
  async save<T>(entity: DeepPartial<T>): Promise<void> {
    this.isTransactionActive();

    entity = helper.fillRequiredWarthogFields(entity);
    await this._queryRunner.manager.save(entity);
  }

  /**
   * Removes a given entity from the database.
   * @param entity: DeepPartial<T>
   */
  async remove<T>(entity: DeepPartial<T>) {
    this.isTransactionActive();

    await this._queryRunner.manager.remove(entity);
  }

  /**
   * Finds first entity that matches given options.
   * @param entity: T
   * @param options: FindOneOptions<T>
   */
  async get<T>(entity: { new (...args: any[]): T }, options: FindOneOptions<T>): Promise<T | undefined> {
    return await this._connection.getRepository(entity).findOne(options);
  }

  private isTransactionActive() {
    if (!this._queryRunner.isTransactionActive) {
      throw new Error('Database operations are only allowed inside a transaction. Please start a transaction first.');
    }
  }

  // Question: Transaction in transaction are allowed?
  async startTransaction() {
    await this._queryRunner.connect();
    await this._queryRunner.startTransaction();
  }

  async commitTransaction() {
    this.isTransactionActive();

    // Update last processed event
    const eventHistory = await SavedEntityEvent.updateOrCreate(this.event);
    await this._queryRunner.manager.save(eventHistory);

    try {
      await this._queryRunner.commitTransaction();
    } catch (error) {
      console.log('There are errors. Rolling back the transaction.');

      // since we have errors lets rollback changes we made
      await this._queryRunner.rollbackTransaction();
    } finally {
      // Query runner needs to be released manually.
      await this._queryRunner.release();
    }
  }
}
