import 'reflect-metadata';

import { BaseContext, Server } from 'warthog';

import { Logger } from './logger';

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
      // Inject a fake user.  In a real app you'd parse a JWT to add the user
      context: (request: any) => {
        const userId = JSON.stringify(request.headers).length.toString();

        return {
          user: {
            id: `user:${userId}`
          }
        };
      },
      introspection: true,
      logger: Logger,
      ...AppOptions
    },
    dbOptions
  );
}
