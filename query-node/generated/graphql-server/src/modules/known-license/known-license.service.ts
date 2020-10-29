import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { KnownLicense } from './known-license.model';

@Service('KnownLicenseService')
export class KnownLicenseService extends BaseService<KnownLicense> {
  constructor(@InjectRepository(KnownLicense) protected readonly repository: Repository<KnownLicense>) {
    super(KnownLicense, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<KnownLicense[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
