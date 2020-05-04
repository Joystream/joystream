import * as shortid from 'shortid';
import { Connection, EntityManager } from 'typeorm';
import { EventHistory } from '.';
import { QueryEvent } from '..';

export default class DB {
  private readonly _connection: Connection;

  constructor(connection: Connection) {
    this._connection = connection;
  }

  /**
   * Return the last processed event. If does not exists create a new one
   */
  async getLastProcessedEvent(event: QueryEvent): Promise<EventHistory> {
    let eventHistory = await this._connection.getRepository(EventHistory).findOne();
    if (!eventHistory) {
      eventHistory = new EventHistory();
    }
    eventHistory.index = event.index;
    eventHistory.eventName = event.event_method;
    eventHistory.blockNumber = event.block_number;
    return eventHistory;
  }

  /**
   * Fixes compatibility between typeorm and warthog models
   * @param entity
   */
  fillRequiredWarthogFields(entity: any) {
    entity['id'] = shortid.generate();
    entity['createdById'] = shortid.generate();
    entity['version'] = 1;
  }

  /**
   * Save given entity instance, if entity is exists then just update
   * @param entity
   */
  async save(entity: any, event: QueryEvent) {
    this.fillRequiredWarthogFields(entity);

    const eventHistory = await this.getLastProcessedEvent(event);

    await this._connection.manager.transaction(async (manager: EntityManager) => {
      await manager.save(entity);
      await manager.save(eventHistory);
    });
  }

  // Find entity that match find options
  async get(entityName: string, options: {}) {
    // Entity is basicly a class so it has name property
    return await this._connection.getRepository(entityName).findOne(options);
  }
}
