import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727444953968 implements MigrationInterface {
  name = 'Migrations1727444953968';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question" ALTER COLUMN "weightage" TYPE numeric(17,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "question" ALTER COLUMN "weightage" TYPE numeric(2,2)`,
    );
  }
}
