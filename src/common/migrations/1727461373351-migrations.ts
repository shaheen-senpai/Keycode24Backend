import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727461373351 implements MigrationInterface {
  name = 'Migrations1727461373351';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject" ADD "created_by_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "subject" ADD CONSTRAINT "FK_317c395125941528a30681dc3d2" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `UPDATE public.subject SET created_by_id = (SELECT id FROM public.user WHERE email = 'susan@gmail.com')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject" DROP CONSTRAINT "FK_317c395125941528a30681dc3d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject" DROP COLUMN "created_by_id"`,
    );
  }
}
