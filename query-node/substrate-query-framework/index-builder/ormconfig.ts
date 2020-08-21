import { ConnectionOptions } from 'typeorm';
const { SnakeNamingStrategy } = require('./src/db/SnakeNamingStrategy');

export const config: ConnectionOptions = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "postgres",
  database: "hydra-tutorial",
  entities: ["src/entities/*.ts"],
  migrations: ["src/migrations/*.ts"],
  cli: {
      migrationsDir: "src/migrations"
  },
  namingStrategy: new SnakeNamingStrategy(),
}

module.exports = config;