import { MigrationInterface, QueryRunner } from "typeorm";

export class Grade1727437991346 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {

        await queryRunner.query(
          `INSERT INTO public.grade (name, created_by_id) VALUES
          ('Grade 1', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 2', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 3', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 4', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 5', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 6', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 7', (select id from public.user where email = 'susan@gmail.com')),
          ('Grade 8', (select id from public.user where email = 'susan@gmail.com'))`,
        );
        await queryRunner.query(
          `INSERT INTO public.subject (name, file_url) VALUES
          ('Maths', 'https://dcgrwjnegntwzuvtcybn.supabase.co/storage/v1/object/public/assets/11-Redblack.pdf'),
          ('Science', 'https://dcgrwjnegntwzuvtcybn.supabase.co/storage/v1/object/public/assets/11-Redblack.pdf'),
          ('English', 'https://dcgrwjnegntwzuvtcybn.supabase.co/storage/v1/object/public/assets/11-Redblack.pdf');`,
        );
        await queryRunner.query(
          `INSERT INTO public.subject_grade (subject_id, grade_id) SELECT (select id from subject where name = 'Maths'), id FROM public.grade;`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
