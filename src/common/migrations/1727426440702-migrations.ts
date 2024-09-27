import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727426440702 implements MigrationInterface {
  name = 'Migrations1727426440702';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subject" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "file_url" character varying, CONSTRAINT "PK_12eee115462e38d62e5455fc054" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "subject_grade" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "subject_id" uuid, "grade_id" uuid, CONSTRAINT "PK_28d930d238627fc4b8eee121e0e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "grade" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "created_by_id" uuid, CONSTRAINT "PK_58c2176c3ae96bf57daebdbcb5e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "email" character varying, "phone" character varying, "type" character varying, "password" character varying, "dob" date, "deleted_at" TIMESTAMP, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_grade" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "grade_id" uuid, CONSTRAINT "PK_0bf1ebca1e1895b4a5f25d399a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject_grade" ADD CONSTRAINT "FK_15b4d42e160a676299e87e9cfb7" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade" ADD CONSTRAINT "FK_4c8a890aef6e294544be45415d8" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_grade" ADD CONSTRAINT "FK_82767c7c694ec1b7a2ac041f3d7" FOREIGN KEY ("grade_id") REFERENCES "grade"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_grade" DROP CONSTRAINT "FK_82767c7c694ec1b7a2ac041f3d7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grade" DROP CONSTRAINT "FK_4c8a890aef6e294544be45415d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject_grade" DROP CONSTRAINT "FK_15b4d42e160a676299e87e9cfb7"`,
    );
    await queryRunner.query(`DROP TABLE "user_grade"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "grade"`);
    await queryRunner.query(`DROP TABLE "subject_grade"`);
    await queryRunner.query(`DROP TABLE "subject"`);
  }
}
