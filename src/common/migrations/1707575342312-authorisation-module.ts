import { MigrationInterface, QueryRunner } from 'typeorm';

export class AuthorisationModule1707575342312 implements MigrationInterface {
  name = 'AuthorisationModule1707575342312';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "group" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_8a45300fd825918f3b40195fbdc" UNIQUE ("name"), CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_group" ("group_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_bd332ba499e012f8d20905f8061" PRIMARY KEY ("group_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying, "last_name" character varying, "email" character varying, "phone" character varying NOT NULL, "is_phone_verified" boolean NOT NULL DEFAULT false, "password" character varying, "dob" date, "deleted_at" TIMESTAMP, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_permission" ("permission_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_e55fe6295b438912cb42bce1baa" PRIMARY KEY ("permission_id", "user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_refresh_token" ("id" uuid NOT NULL, "refresh_token" character varying NOT NULL, "user_id" character varying NOT NULL, "device_id" character varying, CONSTRAINT "PK_2f86bb87603956e017efa2e74ec" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "user_refresh_token_user_id_idx" ON "user_refresh_token" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "group_permission" ("permission_id" uuid NOT NULL, "group_id" uuid NOT NULL, CONSTRAINT "PK_5aadf555f3ea93c95bc952f1547" PRIMARY KEY ("permission_id", "group_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_240853a0c3353c25fb12434ad33" UNIQUE ("name"), CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD CONSTRAINT "FK_7ded8f984bbc2ee6ff0beee491b" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" ADD CONSTRAINT "FK_bb9982562cca83afb76c0ddc0d6" FOREIGN KEY ("group_id") REFERENCES "group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_permission" ADD CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_permission" DROP CONSTRAINT "FK_2305dfa7330dd7f8e211f4f35d9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" DROP CONSTRAINT "FK_bb9982562cca83afb76c0ddc0d6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_group" DROP CONSTRAINT "FK_7ded8f984bbc2ee6ff0beee491b"`,
    );
    await queryRunner.query(`DROP TABLE "permission"`);
    await queryRunner.query(`DROP TABLE "group_permission"`);
    await queryRunner.query(
      `DROP INDEX "public"."user_refresh_token_user_id_idx"`,
    );
    await queryRunner.query(`DROP TABLE "user_refresh_token"`);
    await queryRunner.query(`DROP TABLE "user_permission"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TABLE "user_group"`);
    await queryRunner.query(`DROP TABLE "group"`);
  }
}
