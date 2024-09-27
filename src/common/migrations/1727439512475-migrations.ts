import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1727439512475 implements MigrationInterface {
    name = 'Migrations1727439512475'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "chat" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "recent_message_id" uuid, CONSTRAINT "REL_8a741984a5b43605cbf69d85be" UNIQUE ("recent_message_id"), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "sent_at" TIMESTAMP NOT NULL DEFAULT now(), "sender_id" uuid, "chat_id" uuid, CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "chat" ADD CONSTRAINT "FK_8a741984a5b43605cbf69d85beb" FOREIGN KEY ("recent_message_id") REFERENCES "chat_message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_bd00cce706735f1c4d05c69a310" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_634db173c52edece8dd88ea3d4c" FOREIGN KEY ("chat_id") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_634db173c52edece8dd88ea3d4c"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_bd00cce706735f1c4d05c69a310"`);
        await queryRunner.query(`ALTER TABLE "chat" DROP CONSTRAINT "FK_8a741984a5b43605cbf69d85beb"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP TABLE "chat"`);
    }

}
