import { Service } from 'typedi';
import { Category } from '../category/category.model';

import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository, getConnection } from 'typeorm';

import { NamesFTSOutput } from './names.resolver';

interface RawSQLResult {
    origin_table: string,
    id: string,
    rank: number,
    highlight: string
}

@Service('NamesFTSService')
export class NamesFTSService {
    readonly categoryRepository: Repository<Category>;

    constructor(@InjectRepository(Category) categoryRepository: Repository<Category>
                 ) {
        this.categoryRepository = categoryRepository;
    }

    async search(text: string, limit:number = 5): Promise<NamesFTSOutput[]> {
        const connection = getConnection();
		const queryRunner = connection.createQueryRunner();
        // establish real database connection using our new query runner
		await queryRunner.connect();
        await queryRunner.startTransaction('REPEATABLE READ');

        try {    
            const query = `
            SELECT origin_table, id, 
                ts_rank(tsv, phraseto_tsquery('english', $1)) as rank,
                ts_headline(document, phraseto_tsquery('english', $1)) as highlight
            FROM names_view
            WHERE phraseto_tsquery('english', $1) @@ tsv
            ORDER BY rank DESC
            LIMIT $2`;

            const results = await queryRunner.query(query, [text, limit]) as RawSQLResult[];

            if (results.length == 0) {
                return [];
            }

            const idMap:{ [id:string]: RawSQLResult } = {};
            results.forEach(item => idMap[item.id] = item);
            const ids: string[] = results.map(item => item.id);
            
            const categorys: Category[] = await this.categoryRepository.createQueryBuilder()
                        .where("id IN (:...ids)", { ids }).getMany();

            const enhancedEntities = [...categorys ].map((e) => {
                return { item: e, 
                    rank: idMap[e.id].rank, 
                    highlight: idMap[e.id].highlight,
                    isTypeOf: idMap[e.id].origin_table } as NamesFTSOutput;
            });
            
            return enhancedEntities.reduce((accum: NamesFTSOutput[], entity) => {
                if (entity.rank > 0) {
                    accum.push(entity);
                }
                return accum;
            }, []).sort((a,b) => b.rank - a.rank);
        } finally {
            await queryRunner.commitTransaction();
        }
    }
}