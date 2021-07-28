import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { VideoMediaEncoding } from './video-media-encoding.model';

@Service('VideoMediaEncodingService')
export class VideoMediaEncodingService extends BaseService<VideoMediaEncoding> {
  constructor(@InjectRepository(VideoMediaEncoding) protected readonly repository: Repository<VideoMediaEncoding>) {
    super(VideoMediaEncoding, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<VideoMediaEncoding[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
