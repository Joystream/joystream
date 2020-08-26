import * as shortid from 'shortid';
import { DeepPartial, createConnection, Connection, getConnectionOptions } from 'typeorm';

import { SnakeNamingStrategy } from './SnakeNamingStrategy';
/**
 * Fixes compatibility between typeorm and warthog models.
 *
 * @tutorial Warthog add extra properties to its BaseModel and some of these properties are
 * required. This function mutate the entity to make it compatible with warthog models.
 * Warthog throw error if required properties contains null values.
 *
 * @param entity: DeepPartial<T>
 */
export function fillRequiredWarthogFields<T>(entity: DeepPartial<T>): DeepPartial<T> {
  // Modifying an existing entity so do not add warthog fields
  // eslint-disable-next-line no-prototype-builtins
  if (entity.hasOwnProperty('id')) return entity;

  const requiredFields = {
    id: shortid.generate(),
    createdById: shortid.generate(),
    version: 1,
  };
  return Object.assign(entity, requiredFields);
}

export async function createDBConnection(): Promise<Connection> {
  const connectionOptions = await getConnectionOptions();
  return createConnection(Object.assign(connectionOptions, { namingStrategy: new SnakeNamingStrategy() }));
}
