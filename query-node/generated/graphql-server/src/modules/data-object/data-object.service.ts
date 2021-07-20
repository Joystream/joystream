import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { DataObject } from './data-object.model';

@Service('DataObjectService')
export class DataObjectService extends BaseService<DataObject> {
  constructor(@InjectRepository(DataObject) protected readonly repository: Repository<DataObject>) {
    super(DataObject, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<DataObject[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }
    if (!f.includes('owner')) {
      f = [...f, 'owner'];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
