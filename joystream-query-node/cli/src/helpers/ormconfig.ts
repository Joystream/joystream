export const ormconfig = [
  {
    name: 'default',
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'joystream_query_node',
    schema: 'public',
    synchronize: true,
    entities: ['entities/*.ts'],
  },
];
