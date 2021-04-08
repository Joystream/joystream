import { MigrationInterface, QueryRunner } from "typeorm";

export class SearchMigration1617885566923 implements MigrationInterface {
    name = 'searchMigration1617885566923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE channel 
            ADD COLUMN search_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("title", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE channel 
            ADD COLUMN search_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("title", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX search_channel_idx ON channel USING GIN (search_tsv)`);
        await queryRunner.query(`CREATE INDEX channel_id_idx ON channel (('channel' || '_' || id))`);
        await queryRunner.query(`
            ALTER TABLE video 
            ADD COLUMN search_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("title", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE video 
            ADD COLUMN search_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("title", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX search_video_idx ON video USING GIN (search_tsv)`);
        await queryRunner.query(`CREATE INDEX video_id_idx ON video (('video' || '_' || id))`);

        await queryRunner.query(`
            CREATE VIEW search_view AS
            SELECT 
                text 'channel' AS origin_table, 'channel' || '_' || id AS unique_id, id, search_tsv AS tsv, search_doc AS document 
            FROM
                channel
            UNION ALL
            SELECT 
                text 'video' AS origin_table, 'video' || '_' || id AS unique_id, id, search_tsv AS tsv, search_doc AS document 
            FROM
                video
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW search_view`);
        await queryRunner.query(`DROP INDEX search_channel_idx`);
        await queryRunner.query(`DROP INDEX channel_id_idx`);
        await queryRunner.query(`ALTER TABLE channel DROP COLUMN search_tsv`);
        await queryRunner.query(`ALTER TABLE channel DROP COLUMN search_doc`);
        await queryRunner.query(`DROP INDEX search_video_idx`);
        await queryRunner.query(`DROP INDEX video_id_idx`);
        await queryRunner.query(`ALTER TABLE video DROP COLUMN search_tsv`);
        await queryRunner.query(`ALTER TABLE video DROP COLUMN search_doc`);
    }


}
