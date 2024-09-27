import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727441093660 implements MigrationInterface {
  name = 'Migrations1727441093660';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment" ADD "created_by_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment" ADD CONSTRAINT "FK_056310d9b09f85207e2b641faec" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "assessment" DROP CONSTRAINT "FK_056310d9b09f85207e2b641faec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "assessment" DROP COLUMN "created_by_id"`,
    );
  }
}
