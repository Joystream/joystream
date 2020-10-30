import { Service } from 'typedi';
import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';

import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository, getConnection } from 'typeorm';

import { TitlesFTSOutput } from './titles.resolver';

interface RawSQLResult {
    origin_table: string,
    id: string,
    rank: number,
    highlight: string
}

@Service('TitlesFTSService')
export class TitlesFTSService {
    readonly channelRepository: Repository<Channel>;
    readonly videoRepository: Repository<Video>;

    constructor(@InjectRepository(Channel) channelRepository: Repository<Channel>,
                 @InjectRepository(Video) videoRepository: Repository<Video>
                 ) {
        this.channelRepository = channelRepository;
        this.videoRepository = videoRepository;
    }

    async search(text: string, limit:number = 5): Promise<TitlesFTSOutput[]> {
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
            FROM titles_view
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
            
            const channels: Channel[] = await this.channelRepository.createQueryBuilder()
                        .where("id IN (:...ids)", { ids }).getMany();
            const videos: Video[] = await this.videoRepository.createQueryBuilder()
                        .where("id IN (:...ids)", { ids }).getMany();

            const enhancedEntities = [...channels ,...videos ].map((e) => {
                return { item: e, 
                    rank: idMap[e.id].rank, 
                    highlight: idMap[e.id].highlight,
                    isTypeOf: idMap[e.id].origin_table } as TitlesFTSOutput;
            });
            
            return enhancedEntities.reduce((accum: TitlesFTSOutput[], entity) => {
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