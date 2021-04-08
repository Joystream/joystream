import { Service, Inject } from 'typedi';
import { ChannelCategory } from '../channel-category/channel-category.model';
import { ChannelCategoryService } from '../channel-category/channel-category.service';

import {  ChannelCategoryWhereInput,  } from '../../../generated';

import { InjectRepository } from 'typeorm-typedi-extensions';
import { Repository, getConnection, EntityManager } from 'typeorm';

import { ChannelCategoriesByNameFTSOutput } from './channelCategoriesByName.resolver';

interface RawSQLResult {
    origin_table: string,
    id: string,
    rank: number,
    highlight: string
}

@Service('ChannelCategoriesByNameFTSService')
export class ChannelCategoriesByNameFTSService {
    readonly channelCategoryRepository: Repository<ChannelCategory>;

    constructor(
      @InjectRepository(ChannelCategory) channelCategoryRepository: Repository<ChannelCategory>
      ,@Inject('ChannelCategoryService') public readonly channelCategoryService: ChannelCategoryService 
    ) {
       this.channelCategoryRepository = channelCategoryRepository;  
    }

    /**
    * It takes available where inputs for the full text search(fts), generates sql queries
    * to be run with fts query.
    * @param wheres WhereInput[]
    */
    private async processWheres(wheres: any[]): Promise<[string, any[], number]> {
      const services: any[] = [this.channelCategoryService, ]
      const repositories = [this.channelCategoryRepository, ]
      let [queries, parameters, parameterCounter]: [string, any[], number] = [``, [], 0];

      const generateSqlQuery = (table: string, where: string) =>
        `
  SELECT '${table}_' || id AS unique_id FROM "${table}" ` + where;

      wheres.map((w, index) => {
        if (w) {
          let WHERE = `WHERE `;
          // Combine queries
          if (queries !== ``) {
            queries = queries.concat(`
  UNION ALL`);
          }

          const qb = services[index].buildFindQuery(w as any, undefined, undefined, ['id']);
          // Add query parameters to the parameters list
          parameters.push(...qb.getQueryAndParameters()[1]);

          // Remove the last item which is "table_name"."deleted_at" IS NULL
          qb.expressionMap.wheres.pop();

          // Combine conditions
          qb.expressionMap.wheres.map((w: any, index: number) => {
            let c = ``;

            if (w.condition.includes(`IN (:...`)) {
              // IN condition parameters
              const params: any[] = qb.expressionMap.parameters[`param${index}`];

              // Do nothing when IN condition has an empty list of values
              if (params.length !== 0) {
                const paramsAsString = params
                  .map((_: any) => {
                    parameterCounter += 1;
                    return `$${parameterCounter}`;
                  })
                  .join(`, `);
                c = w.condition.replace(`(:...param${index})`, `(${paramsAsString})`);
              }
            } else if (w.condition.includes(`->>`)) {
              parameterCounter += 1;
              const m = w.condition.match(/->>.*\s=\s:.*/g);
              if (m === null)
                throw Error(`Failed to construct where condition for json field: ${w.condition}`);
              c = w.condition.replace(/=\s:.*/g, `= $${parameterCounter}`);
            } else {
              parameterCounter += 1;
              c = w.condition.replace(`:param${index}`, `$${parameterCounter}`);
            }
            WHERE = WHERE.concat(c, ` `, w.type.toUpperCase(), ` `);
          });

          // Remove unnecessary AND at the end.
          WHERE = WHERE.slice(0, -4);

          // Add new query to queryString
          queries = queries.concat(generateSqlQuery(repositories[index].metadata.tableName, WHERE));
        }
      });

      queries = `
  WITH selected_ids AS (`.concat(
        queries,
        `
  )`
      );
      return [queries, parameters, parameterCounter];
    }

    async search(
      text: string,
      limit = 5,
      skip = 0,
      whereChannelCategory?: ChannelCategoryWhereInput,
    ): Promise<ChannelCategoriesByNameFTSOutput[]> {
        const wheres = [whereChannelCategory, ]
        let [queries, parameters, parameterCounter]: [string, any[], number] = [``, [], 0];

        if (wheres.some(f => f !== undefined)) {
          [queries, parameters, parameterCounter] = await this.processWheres(wheres);
        }
        parameters.push(...[text, limit, skip]);

        return getConnection().transaction<ChannelCategoriesByNameFTSOutput[]>(
          'REPEATABLE READ',
          async (em: EntityManager) => {
            const query = `
              ${queries}
              SELECT origin_table, id, 
                  ts_rank(tsv, phraseto_tsquery('english', $${parameterCounter + 1})) as rank,
                  ts_headline(document, phraseto_tsquery('english', $${parameterCounter +
                    1})) as highlight
              FROM channel_categories_by_name_view
              WHERE phraseto_tsquery('english', $${parameterCounter + 1}) @@ tsv
              ${
                queries !== ``
                  ? `AND unique_id IN (SELECT unique_id FROM selected_ids)`
                  : ``
              } 
              ORDER BY rank DESC
              LIMIT $${parameterCounter + 2}
              OFFSET $${parameterCounter + 3}`;
            const results = (await em.query(query, parameters)) as RawSQLResult[];

            if (results.length === 0) {
                return [];
            }

            const idMap:{ [id:string]: RawSQLResult } = {};
            results.forEach(item => idMap[item.id] = item);
            const ids: string[] = results.map(item => item.id);
            
            const channelCategorys: ChannelCategory[] = await em.createQueryBuilder<ChannelCategory>(ChannelCategory, 'ChannelCategory')
                        .where("id IN (:...ids)", { ids }).getMany();

            const enhancedEntities = [...channelCategorys ].map((e) => {
                return { item: e, 
                    rank: idMap[e.id].rank, 
                    highlight: idMap[e.id].highlight,
                    isTypeOf: idMap[e.id].origin_table } as ChannelCategoriesByNameFTSOutput;
            });

            return enhancedEntities.reduce((accum: ChannelCategoriesByNameFTSOutput[], entity) => {
                if (entity.rank > 0) {
                    accum.push(entity);
                }
                return accum;
            }, []).sort((a,b) => b.rank - a.rank);

        })
    }
}