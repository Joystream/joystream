import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { CuratorGroup } from './curator-group.model';

@Service('CuratorGroupService')
export class CuratorGroupService extends BaseService<CuratorGroup> {
  constructor(@InjectRepository(CuratorGroup) protected readonly repository: Repository<CuratorGroup>) {
    super(CuratorGroup, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<CuratorGroup[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
