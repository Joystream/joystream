import { Request, Role } from '@joystream/types/roles';

export type ComponentProps = {
  actorAccountIds: Array<string>,
  requests: Array<Request>
  roles: Array<Role>,
};
