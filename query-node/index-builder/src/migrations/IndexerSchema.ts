import {MigrationInterface, QueryRunner} from "typeorm";

export class IndexerSchema implements MigrationInterface {
    name = 'IndexerSchema1601637366082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "processed_events_log" ("id" SERIAL NOT NULL, "processor" character varying NOT NULL, "event_id" character varying NOT NULL, "last_scanned_block" integer NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d074516252c7a3090ddc44b9a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_1038d15b8a821947029f3a7d4e" ON "processed_events_log" ("event_id") `);
        await queryRunner.query(`CREATE TABLE "substrate_extrinsic" ("id" SERIAL NOT NULL, "tip" numeric NOT NULL, "block_number" numeric NOT NULL, "version_info" character varying NOT NULL, "meta" jsonb NOT NULL, "method" character varying NOT NULL, "section" character varying NOT NULL, "args" jsonb NOT NULL, "signer" character varying NOT NULL, "signature" character varying NOT NULL, "nonce" integer NOT NULL, "era" jsonb NOT NULL, "hash" character varying NOT NULL, "is_signed" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL DEFAULT 'hydra-indexer', "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, CONSTRAINT "PK_a4c7ce64007d5d29f412c071373" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2edcefa903e8eedd4c6478ddc5" ON "substrate_extrinsic" ("block_number") `);
        await queryRunner.query(`CREATE TABLE "substrate_event" ("id" character varying NOT NULL, "name" character varying NOT NULL, "section" character varying, "method" character varying NOT NULL, "phase" jsonb NOT NULL, "block_number" integer NOT NULL, "index" integer NOT NULL, "params" jsonb NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_id" character varying NOT NULL DEFAULT 'hydra-indexer', "updated_at" TIMESTAMP DEFAULT now(), "updated_by_id" character varying, "deleted_at" TIMESTAMP, "deleted_by_id" character varying, "version" integer NOT NULL, "extrinsic_id" integer, CONSTRAINT "REL_039d734d88baa87b2a46c95117" UNIQUE ("extrinsic_id"), CONSTRAINT "PK_eb7d4a5378857e4a4e82fb6e16d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2f2ba86b666ea355ef4376fdfb" ON "substrate_event" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_4c0dda69c6781e1898e66e97f6" ON "substrate_event" ("block_number") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_71e6776b5604b82d0d17d0c8c4" ON "substrate_event" ("block_number", "index") `);
        await queryRunner.query(`ALTER TABLE "substrate_event" ADD CONSTRAINT "FK_039d734d88baa87b2a46c951175" FOREIGN KEY ("extrinsic_id") REFERENCES "substrate_extrinsic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "substrate_event" DROP CONSTRAINT "FK_039d734d88baa87b2a46c951175"`);
        await queryRunner.query(`DROP INDEX "IDX_71e6776b5604b82d0d17d0c8c4"`);
        await queryRunner.query(`DROP INDEX "IDX_4c0dda69c6781e1898e66e97f6"`);
        await queryRunner.query(`DROP INDEX "IDX_2f2ba86b666ea355ef4376fdfb"`);
        await queryRunner.query(`DROP TABLE "substrate_event"`);
        await queryRunner.query(`DROP INDEX "IDX_2edcefa903e8eedd4c6478ddc5"`);
        await queryRunner.query(`DROP TABLE "substrate_extrinsic"`);
        await queryRunner.query(`DROP INDEX "IDX_1038d15b8a821947029f3a7d4e"`);
        await queryRunner.query(`DROP TABLE "processed_events_log"`);
    }

}
