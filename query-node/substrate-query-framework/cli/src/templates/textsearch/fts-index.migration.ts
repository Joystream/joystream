import {MigrationInterface, QueryRunner} from "typeorm";

export class Ftsquery1590057977695 implements MigrationInterface {
    name = 'Ftsquery1590057977695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // TODO: escape literals
        await queryRunner.query(
        `ALTER TABLE membership 
            ADD COLUMN textsearchable_index_col 
                GENERATED ALWAYS AS to_tsvector( 'english', coalesce(handle,'') ) STORED`);
        await queryRunner.query(`CREATE INDEX textsearch_idx ON membership USING GIN (textsearchable_index_col)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX textsearch_idx`);
        await queryRunner.query(`DROP COLUMN membership.textsearchable_index_col`);
    }

}
