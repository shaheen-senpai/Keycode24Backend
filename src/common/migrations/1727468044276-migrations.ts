import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1727468044276 implements MigrationInterface {
  name = 'Migrations1727468044276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "roll_number" smallint`);
    await queryRunner.query(`
        WITH ranked_students AS (
          SELECT id, ROW_NUMBER() OVER () AS new_roll_number
          FROM public.user
          WHERE type = 'student'
        )
        UPDATE public.user
        SET roll_number = ranked_students.new_roll_number
        FROM ranked_students
        WHERE public.user.id = ranked_students.id;
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "roll_number"`);
  }
}
