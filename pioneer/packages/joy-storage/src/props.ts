import { Request, Role } from '@joystream/types/lib/roles';

export type ComponentProps = {
  actorAccountIds: Array<string>,
  requests: Array<Request>
  roles: Array<Role>,
};
