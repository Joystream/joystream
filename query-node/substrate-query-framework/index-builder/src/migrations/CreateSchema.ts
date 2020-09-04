import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateSchema implements MigrationInterface {
    name = 'CreateSchema1598446681310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "substrate_extrinsic" ("id" SERIAL NOT NULL, "tip" numeric NOT NULL, "block_number" numeric NOT NULL, "version_info" character varying NOT NULL, "meta" jsonb NOT NULL, "method" character varying NOT NULL, "section" character varying NOT NULL, "args" jsonb NOT NULL, "signer" character varying NOT NULL, "signature" character varying NOT NULL, "nonce" integer NOT NULL, "era" jsonb NOT NULL, "hash" character varying NOT NULL, "is_signed" boolean NOT NULL, CONSTRAINT "PK_a4c7ce64007d5d29f412c071373" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "substrate_event" ("id" character varying NOT NULL, "name" character varying NOT NULL, "section" character varying, "method" character varying NOT NULL, "phase" jsonb NOT NULL, "block_number" integer NOT NULL, "index" integer NOT NULL, "params" jsonb NOT NULL, "extrinsic_id" integer, CONSTRAINT "REL_039d734d88baa87b2a46c95117" UNIQUE ("extrinsic_id"), CONSTRAINT "PK_eb7d4a5378857e4a4e82fb6e16d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "substrate_event" ADD CONSTRAINT "FK_039d734d88baa87b2a46c951175" FOREIGN KEY ("extrinsic_id") REFERENCES "substrate_extrinsic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "substrate_event" DROP CONSTRAINT "FK_039d734d88baa87b2a46c951175"`);
        await queryRunner.query(`DROP TABLE "substrate_event"`);
        await queryRunner.query(`DROP TABLE "substrate_extrinsic"`);
    }

}
