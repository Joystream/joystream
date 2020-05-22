import { BaseService } from 'warthog';
import { Inject, Service } from 'typedi';
import { Membership } from './../membership/membership.model';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository } from 'typeorm';

import { FTSOutput } from './fts.resolver'

@Service('FTSService')
export default class FTSService extends BaseService<Membership> {
    constructor(@InjectRepository(Membership) protected readonly repository: Repository<Membership>) {
        super(Membership, repository);
    }

    async search(query: string, limit:number = 10): Promise<FTSOutput[]> {
        const { entities, raw } =  await this.repository.createQueryBuilder()
            .addSelect(
                `ts_rank_cd(textsearchable_index_col, websearch_to_tsquery('english', :query) )`,
                `rank`
            )
            .orderBy('rank', 'DESC')
            .limit(limit)
            .setParameter('query', query)
            .getRawAndEntities();

        const enhancedEntities = entities.map((e, index) => {
            return { item: e, rank: raw[index].rank, isTypeOf: 'Membership' } as FTSOutput;
        });
          
        return enhancedEntities.reduce((accum: FTSOutput[], entity) => {
            if (entity.rank > 0) {
                accum.push(entity);
            }
            return accum;
        }, []);
    }   
}