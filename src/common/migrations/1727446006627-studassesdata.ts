import { MigrationInterface, QueryRunner } from 'typeorm';

export class Studassesdata1727446006627 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO public.assessment (name, grade_id, subject_id, level, created_by_id) VALUES
          ('Numbers and Operations Mastery', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'easy', (select id from public.user where email = 'susan@gmail.com')),
          ('Geometry Skills Assessment', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'easy', (select id from public.user where email = 'susan@gmail.com')),
          ('Algebra Fundamentals Test', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'medium', (select id from public.user where email = 'susan@gmail.com')),
          ('Math Reasoning Challenge', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'hard', (select id from public.user where email = 'susan@gmail.com')),
          ('Problem-Solving Proficiency Exam', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'medium', (select id from public.user where email = 'susan@gmail.com')),
          ('Calculus Concepts Quiz', (select id from public.grade where name = 'Grade 8'), (select id from public.subject where name = 'Maths'), 'hard', (select id from public.user where email = 'susan@gmail.com'))`,
    );
    const assessments = await queryRunner.query(
      `SELECT * from public.assessment`,
    );
    for (const assessment of assessments) {
      await queryRunner.query(
        `INSERT INTO public.student_assessment (assessment_id, score, user_id) SELECT '${assessment.id}', (array[20, 30, 40, 50, 60, 70, 80, 90, 100])[floor(random() * 9 + 1)], id FROM public.user where type = 'student';`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
