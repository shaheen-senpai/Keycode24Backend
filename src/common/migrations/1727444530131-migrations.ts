import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1727444530131 implements MigrationInterface {
    name = 'Migrations1727444530131'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ADD "created_by_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "FK_bb0b9f6f9232bfaa3e6c9e64620" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "FK_bb0b9f6f9232bfaa3e6c9e64620"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "created_by_id"`);
    }

}
