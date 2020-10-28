import { MigrationInterface, QueryRunner } from "typeorm";

export class NamesMigration1603710751018 implements MigrationInterface {
    name = 'namesMigration1603710751018'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE category 
            ADD COLUMN names_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("name", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE category 
            ADD COLUMN names_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("name", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX names_category_idx ON category USING GIN (names_tsv)`);

        await queryRunner.query(`
            CREATE VIEW names_view AS
            SELECT 
                text 'category' AS origin_table, id, names_tsv AS tsv, names_doc AS document 
            FROM
                category
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW names_view`);
        await queryRunner.query(`DROP INDEX names_category_idx`);
        await queryRunner.query(`ALTER TABLE category DROP COLUMN names_tsv`);
        await queryRunner.query(`ALTER TABLE category DROP COLUMN names_doc`);
    }


}
