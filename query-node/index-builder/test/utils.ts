/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
//import { dropdb, createdb } from 'pgtools';
import * as util from 'util';
const pgtools = require('pgtools');
const dropdb = pgtools.dropdb;
const createdb = pgtools.createdb;


export function getPgConfig(): { [index: string] : unknown } {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  };
}

export async function dropDb(db?: string): Promise<void> {
  const database = db || process.env.DB_NAME;
  const drop = util.promisify(dropdb);

  try {
    await drop(getPgConfig(), database);
  } catch (e) {
    console.error(e);
  }
}

export async function createDb(db?: string): Promise<void> {
  const database = db || process.env.DB_NAME;
  const create = util.promisify(createdb);

  try {
    await create(getPgConfig(), database);
  } catch (e) {
    console.error(e);
  }
}