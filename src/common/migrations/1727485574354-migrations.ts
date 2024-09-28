import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727485574354 implements MigrationInterface {
  name = 'Migrations1727485574354';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject" ADD "document_name" character varying DEFAULT 'Class IX Probability'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject" DROP COLUMN "document_name"`,
    );
  }
}
