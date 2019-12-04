import { Role } from '@joystream/types/roles';

export interface ITransport {
  roles: () => Promise<Array<Role>>
}
