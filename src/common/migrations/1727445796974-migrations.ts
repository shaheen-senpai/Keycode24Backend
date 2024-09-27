import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727445796974 implements MigrationInterface {
  name = 'Migrations1727445796974';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "student_assessment" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "assessment_id" uuid, "score" smallint, CONSTRAINT "PK_7797b91d055519e8fd54d130254" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "student_assessment" ADD CONSTRAINT "FK_fdab7dd69724dc58efd19f4f343" FOREIGN KEY ("assessment_id") REFERENCES "assessment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "student_assessment" DROP CONSTRAINT "FK_fdab7dd69724dc58efd19f4f343"`,
    );
    await queryRunner.query(`DROP TABLE "student_assessment"`);
  }
}
