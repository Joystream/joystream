import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { BaseService } from 'warthog';

import { MemberRegistered } from './member-registered.model';

@Service('MemberRegisteredService')
export class MemberRegisteredService extends BaseService<MemberRegistered> {
  constructor(
    @InjectRepository(MemberRegistered) protected readonly repository: Repository<MemberRegistered>
  ) {
    super(MemberRegistered, repository);
  }
}
