import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService, WhereInput } from 'warthog';

import { ClassEntity } from './class-entity.model';

@Service('ClassEntityService')
export class ClassEntityService extends BaseService<ClassEntity> {
  constructor(@InjectRepository(ClassEntity) protected readonly repository: Repository<ClassEntity>) {
    super(ClassEntity, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string,
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<ClassEntity[]> {
    let f = fields;
    if (f == undefined) {
      f = [];
    }

    return super.find<W>(where, orderBy, limit, offset, f);
  }
}
