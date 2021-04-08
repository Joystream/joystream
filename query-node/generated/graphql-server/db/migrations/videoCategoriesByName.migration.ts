import { MigrationInterface, QueryRunner } from "typeorm";

export class VideoCategoriesByNameMigration1617885566925 implements MigrationInterface {
    name = 'videoCategoriesByNameMigration1617885566925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE video_category 
            ADD COLUMN video_categories_by_name_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("name", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE video_category 
            ADD COLUMN video_categories_by_name_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("name", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX video_categories_by_name_video_category_idx ON video_category USING GIN (video_categories_by_name_tsv)`);
        await queryRunner.query(`CREATE INDEX video_category_id_idx ON video_category (('video_category' || '_' || id))`);

        await queryRunner.query(`
            CREATE VIEW video_categories_by_name_view AS
            SELECT 
                text 'video_category' AS origin_table, 'video_category' || '_' || id AS unique_id, id, video_categories_by_name_tsv AS tsv, video_categories_by_name_doc AS document 
            FROM
                video_category
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW video_categories_by_name_view`);
        await queryRunner.query(`DROP INDEX video_categories_by_name_video_category_idx`);
        await queryRunner.query(`DROP INDEX video_category_id_idx`);
        await queryRunner.query(`ALTER TABLE video_category DROP COLUMN video_categories_by_name_tsv`);
        await queryRunner.query(`ALTER TABLE video_category DROP COLUMN video_categories_by_name_doc`);
    }


}
