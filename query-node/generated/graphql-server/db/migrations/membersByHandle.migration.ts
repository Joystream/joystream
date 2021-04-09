import { MigrationInterface, QueryRunner } from "typeorm";

export class MembersByHandleMigration1617953675056 implements MigrationInterface {
    name = 'membersByHandleMigration1617953675056'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape 
        await queryRunner.query(`
            ALTER TABLE membership 
            ADD COLUMN members_by_handle_tsv tsvector 
            GENERATED ALWAYS AS (  
                    setweight(to_tsvector('english', coalesce("handle", '')), 'A') 
                ) 
            STORED;
        `);
        await queryRunner.query(`
            ALTER TABLE membership 
            ADD COLUMN members_by_handle_doc text 
            GENERATED ALWAYS AS (  
                    coalesce("handle", '') 
                ) 
            STORED;
        `);
        await queryRunner.query(`CREATE INDEX members_by_handle_membership_idx ON membership USING GIN (members_by_handle_tsv)`);
        await queryRunner.query(`CREATE INDEX membership_id_idx ON membership (('membership' || '_' || id))`);

        await queryRunner.query(`
            CREATE VIEW members_by_handle_view AS
            SELECT 
                text 'membership' AS origin_table, 'membership' || '_' || id AS unique_id, id, members_by_handle_tsv AS tsv, members_by_handle_doc AS document 
            FROM
                membership
        `);

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW members_by_handle_view`);
        await queryRunner.query(`DROP INDEX members_by_handle_membership_idx`);
        await queryRunner.query(`DROP INDEX membership_id_idx`);
        await queryRunner.query(`ALTER TABLE membership DROP COLUMN members_by_handle_tsv`);
        await queryRunner.query(`ALTER TABLE membership DROP COLUMN members_by_handle_doc`);
    }


}
