import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727455793951 implements MigrationInterface {
  name = 'Migrations1727455793951';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment" ADD "outcomes" text array`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "assessment" DROP COLUMN "outcomes"`);
  }
}
