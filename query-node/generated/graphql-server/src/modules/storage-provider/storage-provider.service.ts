import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { StorageProvider } from './storage-provider.model';

@Service('StorageProviderService')
export class StorageProviderService extends BaseService<StorageProvider> {
  constructor(@InjectRepository(StorageProvider) protected readonly repository: Repository<StorageProvider>) {
    super(StorageProvider, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<StorageProvider[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
