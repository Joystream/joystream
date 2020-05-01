import * as dotenv from 'dotenv';
import * as fs from 'fs-extra';
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

export function getTypeormModelGeneratorConnectionConfig() {
  const envConfig = dotenv.parse(fs.readFileSync('.env'));

  const command = [
    './node_modules/.bin/typeorm-model-generator ',
    `--host ${envConfig['TYPEORM_HOST']}`,
    `--port ${envConfig['TYPEORM_PORT']}`,
    `--database ${envConfig['TYPEORM_DATABASE']}`,
    `--engine postgres`,
    `--output entities`,
    `--user ${envConfig['TYPEORM_USERNAME']}`,
    `--pass ${envConfig['TYPEORM_PASSWORD']}`,
    '--noConfig'
  ].join(' ');
  return command;
}
