import {MigrationInterface, QueryRunner} from "typeorm";

export class GenerateSchema1598003552135 implements MigrationInterface {
    name = 'GenerateSchema1598003552135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chain_extrinsic" ("id" SERIAL NOT NULL, "tip" numeric NOT NULL, "block_number" numeric NOT NULL, "version_info" character varying NOT NULL, "meta" jsonb NOT NULL, "method" character varying NOT NULL, "section" character varying NOT NULL, "params" jsonb NOT NULL, "signer" character varying NOT NULL, "signature" character varying NOT NULL, "nonce" integer NOT NULL, "era" jsonb NOT NULL, "hash" character varying NOT NULL, "is_signed" boolean NOT NULL, CONSTRAINT "PK_73f5e4d012d31276fad843304f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "query_event_entity" ("id" character varying NOT NULL, "name" character varying NOT NULL, "section" character varying, "method" character varying, "phase" jsonb NOT NULL, "block_number" integer NOT NULL, "index" integer NOT NULL, "params" jsonb NOT NULL, "extrinsic_id" integer, CONSTRAINT "REL_a3af84b1d7c7ea3bab96e4df75" UNIQUE ("extrinsic_id"), CONSTRAINT "PK_f351e37dd1af57cfcdf722c37fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "query_event_entity" ADD CONSTRAINT "FK_a3af84b1d7c7ea3bab96e4df757" FOREIGN KEY ("extrinsic_id") REFERENCES "chain_extrinsic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "query_event_entity" DROP CONSTRAINT "FK_a3af84b1d7c7ea3bab96e4df757"`);
        await queryRunner.query(`DROP TABLE "query_event_entity"`);
        await queryRunner.query(`DROP TABLE "chain_extrinsic"`);
    }

}
