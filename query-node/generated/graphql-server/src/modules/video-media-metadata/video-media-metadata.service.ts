import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { VideoMediaMetadata } from './video-media-metadata.model';

@Service('VideoMediaMetadataService')
export class VideoMediaMetadataService extends BaseService<VideoMediaMetadata> {
  constructor(@InjectRepository(VideoMediaMetadata) protected readonly repository: Repository<VideoMediaMetadata>) {
    super(VideoMediaMetadata, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<VideoMediaMetadata[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
