import { config } from "dotenv";

export function initConfig() {
  // load envs
  config();
}

export const typeOrmConfigName: string = process.argv[2];
