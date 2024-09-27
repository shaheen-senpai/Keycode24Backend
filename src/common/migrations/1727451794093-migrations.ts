import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1727451794093 implements MigrationInterface {
    name = 'Migrations1727451794093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chat" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP COLUMN "created_at"`);
    }

}
