import { MigrationInterface, QueryRunner } from "typeorm";

export class TitlesMigration1603710751027 implements MigrationInterface {
    name = 'titlesMigration1603710751027'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE channel 
            ADD COLUMN titles_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("title", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE channel 
            ADD COLUMN titles_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("title", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX titles_channel_idx ON channel USING GIN (titles_tsv)`);
        await queryRunner.query(`
            ALTER TABLE video 
            ADD COLUMN titles_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("title", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE video 
            ADD COLUMN titles_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("title", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX titles_video_idx ON video USING GIN (titles_tsv)`);

        await queryRunner.query(`
            CREATE VIEW titles_view AS
            SELECT 
                text 'channel' AS origin_table, id, titles_tsv AS tsv, titles_doc AS document 
            FROM
                channel
            UNION ALL
            SELECT 
                text 'video' AS origin_table, id, titles_tsv AS tsv, titles_doc AS document 
            FROM
                video
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW titles_view`);
        await queryRunner.query(`DROP INDEX titles_channel_idx`);
        await queryRunner.query(`ALTER TABLE channel DROP COLUMN titles_tsv`);
        await queryRunner.query(`ALTER TABLE channel DROP COLUMN titles_doc`);
        await queryRunner.query(`DROP INDEX titles_video_idx`);
        await queryRunner.query(`ALTER TABLE video DROP COLUMN titles_tsv`);
        await queryRunner.query(`ALTER TABLE video DROP COLUMN titles_doc`);
    }


}
