import { MigrationInterface, QueryRunner } from "typeorm";

export class HandlesMigration1603710751030 implements MigrationInterface {
    name = 'handlesMigration1603710751030'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE member 
            ADD COLUMN handles_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("handle", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE member 
            ADD COLUMN handles_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("handle", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX handles_member_idx ON member USING GIN (handles_tsv)`);

        await queryRunner.query(`
            CREATE VIEW handles_view AS
            SELECT 
                text 'member' AS origin_table, id, handles_tsv AS tsv, handles_doc AS document 
            FROM
                member
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW handles_view`);
        await queryRunner.query(`DROP INDEX handles_member_idx`);
        await queryRunner.query(`ALTER TABLE member DROP COLUMN handles_tsv`);
        await queryRunner.query(`ALTER TABLE member DROP COLUMN handles_doc`);
    }


}
