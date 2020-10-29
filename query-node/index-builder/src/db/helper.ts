import * as shortid from 'shortid';
import { DeepPartial, createConnection, QueryRunner, Connection, getConnection } from 'typeorm';

import config from './ormconfig';

import Debug from 'debug';
import { logError } from '../utils/errors';

const debug = Debug('index-builder:helper');

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
  //eslint-disable-next-line no-prototype-builtins
  if (!entity.hasOwnProperty('id')) {
    Object.assign(entity, { id: shortid.generate() });
  }
  //eslint-disable-next-line no-prototype-builtins
  if (!entity.hasOwnProperty('createdById')) {
    Object.assign(entity, { createdById: shortid.generate() });
  }
  //eslint-disable-next-line no-prototype-builtins
  if (!entity.hasOwnProperty('version')) {
    Object.assign(entity, { version: 1 });
  }
  return entity;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createDBConnection(entities: any[] = []): Promise<Connection> {
  //const connectionOptions = await getConnectionOptions();
  const _config = config();
  entities.map((e) => _config.entities?.push(e));
  debug(`DB config: ${JSON.stringify(_config, null, 2)}`);
  return createConnection(_config);
}

export async function doInTransaction<T>(fn: (qn: QueryRunner) => Promise<T>): Promise<T> {
  const queryRunner = getConnection().createQueryRunner();
  try {
    // establish real database connection
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const result = await fn(queryRunner);

    await queryRunner.commitTransaction();

    return result;
  } catch (error) {
    console.error(`Rolling back the transaction due to errors: ${logError(error)}`);

    // Since we have errors lets rollback changes we made
    await queryRunner.rollbackTransaction();
    throw new Error(error);
  } finally {
    // Query runner needs to be released manually.
    await queryRunner.release();
  }
}
