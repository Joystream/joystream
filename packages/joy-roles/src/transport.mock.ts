import { ITransport } from './transport'
import { Transport as TransportBase } from './middleware/transport'

import { Role } from '@joystream/types/roles';

export class Transport extends TransportBase implements ITransport {
  public async roles(): Promise<Array<Role>> {
    return this.promise<Array<Role>>(
      [
        new Role("StorageProvider"),
      ]
    )
  }
}


