import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { FeaturedVideo } from './featured-video.model';

@Service('FeaturedVideoService')
export class FeaturedVideoService extends BaseService<FeaturedVideo> {
  constructor(@InjectRepository(FeaturedVideo) protected readonly repository: Repository<FeaturedVideo>) {
    super(FeaturedVideo, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<FeaturedVideo[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
