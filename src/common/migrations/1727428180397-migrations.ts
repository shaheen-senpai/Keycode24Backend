import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727428180397 implements MigrationInterface {
  name = 'Migrations1727428180397';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "question" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question_text" character varying, "options" text array, "answer" character varying, "assessment_id" uuid, "type" character varying, "weightage" numeric(2,2), "deleted_at" TIMESTAMP, CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "assessment" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "grade_id" uuid, "subject_id" uuid, "level" character varying, "deleted_at" TIMESTAMP, CONSTRAINT "PK_c511a7dc128256876b6b1719401" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" ADD CONSTRAINT "FK_88fc1aa497e365de0a6d8cb3b25" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment" ADD CONSTRAINT "FK_6f632dfb9bd327b46bf13c0d5ea" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment" ADD CONSTRAINT "FK_5f562499b9b7c251815f6e14dfe" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment" DROP CONSTRAINT "FK_5f562499b9b7c251815f6e14dfe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment" DROP CONSTRAINT "FK_6f632dfb9bd327b46bf13c0d5ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "question" DROP CONSTRAINT "FK_88fc1aa497e365de0a6d8cb3b25"`,
    );
    await queryRunner.query(`DROP TABLE "assessment"`);
    await queryRunner.query(`DROP TABLE "question"`);
  }
}
