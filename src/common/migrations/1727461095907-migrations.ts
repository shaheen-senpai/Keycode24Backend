import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1727461095907 implements MigrationInterface {
    name = 'Migrations1727461095907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "lesson_plan" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "created_by_id" uuid, "data" jsonb, "subject_id" uuid, CONSTRAINT "PK_d3c65dda030a6dc2a4417db7feb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "lesson_plan" ADD CONSTRAINT "FK_02d8b0cf67e1a32c40f5ba18a5e" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lesson_plan" ADD CONSTRAINT "FK_954b7a09399397a35e40665850b" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "lesson_plan" DROP CONSTRAINT "FK_954b7a09399397a35e40665850b"`);
        await queryRunner.query(`ALTER TABLE "lesson_plan" DROP CONSTRAINT "FK_02d8b0cf67e1a32c40f5ba18a5e"`);
        await queryRunner.query(`DROP TABLE "lesson_plan"`);
    }

}
