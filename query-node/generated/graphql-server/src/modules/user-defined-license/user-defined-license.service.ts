import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { UserDefinedLicense } from './user-defined-license.model';

@Service('UserDefinedLicenseService')
export class UserDefinedLicenseService extends BaseService<UserDefinedLicense> {
  constructor(@InjectRepository(UserDefinedLicense) protected readonly repository: Repository<UserDefinedLicense>) {
    super(UserDefinedLicense, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<UserDefinedLicense[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
