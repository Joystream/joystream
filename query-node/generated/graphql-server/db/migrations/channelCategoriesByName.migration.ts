import { MigrationInterface, QueryRunner } from "typeorm";

export class ChannelCategoriesByNameMigration1617953675055 implements MigrationInterface {
    name = 'channelCategoriesByNameMigration1617953675055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE channel_category 
            ADD COLUMN channel_categories_by_name_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("name", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE channel_category 
            ADD COLUMN channel_categories_by_name_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("name", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX channel_categories_by_name_channel_category_idx ON channel_category USING GIN (channel_categories_by_name_tsv)`);
        await queryRunner.query(`CREATE INDEX channel_category_id_idx ON channel_category (('channel_category' || '_' || id))`);

        await queryRunner.query(`
            CREATE VIEW channel_categories_by_name_view AS
            SELECT 
                text 'channel_category' AS origin_table, 'channel_category' || '_' || id AS unique_id, id, channel_categories_by_name_tsv AS tsv, channel_categories_by_name_doc AS document 
            FROM
                channel_category
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW channel_categories_by_name_view`);
        await queryRunner.query(`DROP INDEX channel_categories_by_name_channel_category_idx`);
        await queryRunner.query(`DROP INDEX channel_category_id_idx`);
        await queryRunner.query(`ALTER TABLE channel_category DROP COLUMN channel_categories_by_name_tsv`);
        await queryRunner.query(`ALTER TABLE channel_category DROP COLUMN channel_categories_by_name_doc`);
    }


}
