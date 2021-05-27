import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { ChannelCategory } from './channel-category.model';

@Service('ChannelCategoryService')
export class ChannelCategoryService extends BaseService<ChannelCategory> {
  constructor(@InjectRepository(ChannelCategory) protected readonly repository: Repository<ChannelCategory>) {
    super(ChannelCategory, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<ChannelCategory[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
