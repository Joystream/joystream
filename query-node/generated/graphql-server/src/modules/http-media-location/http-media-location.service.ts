import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { HttpMediaLocation } from './http-media-location.model';

@Service('HttpMediaLocationService')
export class HttpMediaLocationService extends BaseService<HttpMediaLocation> {
  constructor(@InjectRepository(HttpMediaLocation) protected readonly repository: Repository<HttpMediaLocation>) {
    super(HttpMediaLocation, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<HttpMediaLocation[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
