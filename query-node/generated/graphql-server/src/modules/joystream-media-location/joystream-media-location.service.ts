import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { JoystreamMediaLocation } from './joystream-media-location.model';

@Service('JoystreamMediaLocationService')
export class JoystreamMediaLocationService extends BaseService<JoystreamMediaLocation> {
  constructor(
    @InjectRepository(JoystreamMediaLocation) protected readonly repository: Repository<JoystreamMediaLocation>
  ) {
    super(JoystreamMediaLocation, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<JoystreamMediaLocation[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
