import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727462427282 implements MigrationInterface {
  name = 'Migrations1727462427282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "gender" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "gender"`);
  }
}
