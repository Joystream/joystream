import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
import { createConnection, getConnection } from 'typeorm';

import { getTemplatePath } from '../utils/utils';

/**
 * Update typeorms' .env config file with top level .env file
 */
export function getTypeormConfig(): string {
  const envConfig = dotenv.parse(fs.readFileSync(getTemplatePath('dotenv-ormconfig.mst')));

  envConfig['TYPEORM_DATABASE'] = process.env.DB_NAME || envConfig['TYPEORM_DATABASE'];
  envConfig['TYPEORM_USERNAME'] = process.env.DB_USER || envConfig['TYPEORM_USERNAME'];
  envConfig['TYPEORM_PASSWORD'] = process.env.DB_PASS || envConfig['TYPEORM_PASSWORD'];
  envConfig['TYPEORM_HOST'] = process.env.DB_HOST || envConfig['TYPEORM_HOST'];
  envConfig['TYPEORM_PORT'] = process.env.DB_PORT || envConfig['TYPEORM_PORT'];

  const newEnvConfig = Object.keys(envConfig)
    .map(key => `${key}=${envConfig[key]}`)
    .join('\n');
  return newEnvConfig;
}

export async function resetLastProcessedEvent(): Promise<void> {
  await createConnection();
  // get a connection and create a new query runner
  const queryRunner = getConnection().createQueryRunner();

  // establish real database connection using our new query runner
  await queryRunner.connect();
  const lastProcessedEvent = {
    blockNumber: 0,
    eventName: 'ExtrinsicSuccess',
    index: 0,
  };

  // now we can execute any queries on a query runner
  await queryRunner.query(
    `UPDATE saved_entity_event SET 
    "blockNumber" = ${lastProcessedEvent.blockNumber}, 
    index = ${lastProcessedEvent.index},
    "eventName" = '${lastProcessedEvent.eventName}';`
  );

  await queryRunner.release();
}
