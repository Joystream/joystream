//import { dropdb, createdb } from 'pgtools';
import * as util from 'util';
const pgtools = require('pgtools');
const dropdb: Function = pgtools.dropdb as Function;
const createdb: Function = pgtools.createdb as Function;


export function getPgConfig(): { [index: string] : any } {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
  };
}

export async function dropDb(): Promise<void> {
  const database = process.env.DB_NAME;
  const drop = util.promisify(dropdb);

  try {
    await drop(getPgConfig(), database);
  } catch (e) {
    console.error(e);
  }
}

export async function createDb(): Promise<void> {
  const database = process.env.DB_NAME;
  const create = util.promisify(createdb);

  try {
    await create(getPgConfig(), database);
  } catch (e) {
    console.error(e);
  }
}