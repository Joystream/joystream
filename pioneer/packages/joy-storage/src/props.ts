import { Role } from '@joystream/types/members';
import { Request } from '@joystream/types/roles';

export type ComponentProps = {
  actorAccountIds: Array<string>;
  requests: Array<Request>;
  roles: Array<Role>;
};
