import { MigrationInterface, QueryRunner } from "typeorm";

export class GradeandSubject1727443842220 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          `INSERT INTO public.subject_grade (subject_id, grade_id) SELECT (select id from subject where name = 'Science'), id FROM public.grade;`,
        );
        await queryRunner.query(
          `INSERT INTO public.subject_grade (subject_id, grade_id) SELECT (select id from subject where name = 'English'), id FROM public.grade;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
