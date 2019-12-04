import { ApiProps } from '@polkadot/react-api/types';
import ApiPromise from '@polkadot/api/promise';

import { ITransport } from './transport'
import { Transport as TransportBase } from './middleware/transport'

import { Role } from '@joystream/types/roles';

export class Transport extends TransportBase implements ITransport {
  protected api: ApiPromise

  constructor(apiProps: ApiProps) {
    super()
    this.api = apiProps.api
  }

  public async roles(): Promise<Array<Role>> {
    const roles: any = await this.api.query.actors.availableRoles()
    return this.promise<Array<Role>>(roles.map((role: Role) => role))
  }
}


