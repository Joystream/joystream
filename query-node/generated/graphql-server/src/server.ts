import 'reflect-metadata';
import { GraphQLID } from 'graphql';
import { BaseContext, DataLoaderMiddleware, Server, ServerOptions } from 'warthog';
import { DateResolver } from 'graphql-scalars';
import { buildSchema } from 'type-graphql';

import { Logger } from './logger';
import { getPubSub } from './pubsub';

interface Context extends BaseContext {
  user: {
    email: string;
    id: string;
    permissions: string;
  };
}

export function getServer(AppOptions = {}, dbOptions = {}) {
  return new Server<Context>(
    {
      introspection: true,
      logger: Logger,
      ...AppOptions,
    },
    dbOptions
  );
}

export async function buildServerSchema<C extends BaseContext>(
  server: Server<C>,
  appOptions: ServerOptions<C> = {}
): Promise<void> {
  server.schema = await buildSchema({
    authChecker: server.authChecker,
    scalarsMap: [
      {
        type: 'ID' as any,
        scalar: GraphQLID,
      },
      // Note: DateTime already included in type-graphql
      {
        type: 'DateOnlyString' as any,
        scalar: DateResolver,
      },
    ],
    container: server.container as any,
    globalMiddlewares: [DataLoaderMiddleware, ...(appOptions.middlewares || [])],
    resolvers: server.config.get('RESOLVERS_PATH'),
    pubSub: getPubSub(),
    // TODO: scalarsMap: [{ type: GraphQLDate, scalar: GraphQLDate }]
    validate: server.config.get('VALIDATE_RESOLVERS') === 'true',
  });
}
