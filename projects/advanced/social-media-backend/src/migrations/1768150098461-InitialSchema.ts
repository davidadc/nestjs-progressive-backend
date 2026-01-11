import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1768150098461 implements MigrationInterface {
    name = 'InitialSchema1768150098461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "postId" uuid NOT NULL, "userId" uuid NOT NULL, "content" text NOT NULL, "likesCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e44ddaaa6d058cb4092f83ad61" ON "comments" ("postId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e8d7c49f218ebb14314fdb374" ON "comments" ("userId") `);
        await queryRunner.query(`CREATE TABLE "hashtags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tag" character varying NOT NULL, "usageCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0b4ef8e83392129fb3373fdb3af" UNIQUE ("tag"), CONSTRAINT "PK_994c5bf9151587560db430018c5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b4ef8e83392129fb3373fdb3a" ON "hashtags" ("tag") `);
        await queryRunner.query(`CREATE TABLE "posts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "authorId" uuid NOT NULL, "content" text NOT NULL, "images" text, "likesCount" integer NOT NULL DEFAULT '0', "commentsCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c5a322ad12a7bf95460c958e80" ON "posts" ("authorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_46bc204f43827b6f25e0133dbf" ON "posts" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "likes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "targetId" uuid NOT NULL, "targetType" character varying(10) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e8ca69742fd55fce9524440bf6a" UNIQUE ("userId", "targetId", "targetType"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cfd8e81fac09d7339a32e57d90" ON "likes" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f7fdba1888c7acc68855dd33a4" ON "likes" ("targetId", "targetType") `);
        await queryRunner.query(`CREATE TABLE "follows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "followerId" uuid NOT NULL, "followingId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_105079775692df1f8799ed0fac8" UNIQUE ("followerId", "followingId"), CONSTRAINT "PK_8988f607744e16ff79da3b8a627" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fdb91868b03a2040db408a5333" ON "follows" ("followerId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ef463dd9a2ce0d673350e36e0f" ON "follows" ("followingId") `);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" character varying(10) NOT NULL, "actorId" uuid NOT NULL, "targetId" uuid NOT NULL, "read" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_831a5a06f879fb0bebf8965871" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying NOT NULL, "name" character varying NOT NULL, "password" character varying NOT NULL, "avatar" character varying, "bio" text, "followersCount" integer NOT NULL DEFAULT '0', "followingCount" integer NOT NULL DEFAULT '0', "postsCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username") `);
        await queryRunner.query(`CREATE TABLE "post_hashtags" ("hashtagId" uuid NOT NULL, "postId" uuid NOT NULL, CONSTRAINT "PK_50a352c8d6f5c550e88843e6908" PRIMARY KEY ("hashtagId", "postId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_31c935be539e76295a7f1c632a" ON "post_hashtags" ("hashtagId") `);
        await queryRunner.query(`CREATE INDEX "IDX_003e77538237089ff217a1cfe7" ON "post_hashtags" ("postId") `);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_fdb91868b03a2040db408a53331" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "follows" ADD CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_hashtags" ADD CONSTRAINT "FK_31c935be539e76295a7f1c632aa" FOREIGN KEY ("hashtagId") REFERENCES "hashtags"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "post_hashtags" ADD CONSTRAINT "FK_003e77538237089ff217a1cfe74" FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_hashtags" DROP CONSTRAINT "FK_003e77538237089ff217a1cfe74"`);
        await queryRunner.query(`ALTER TABLE "post_hashtags" DROP CONSTRAINT "FK_31c935be539e76295a7f1c632aa"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_44412a2d6f162ff4dc1697d0db7"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_ef463dd9a2ce0d673350e36e0fb"`);
        await queryRunner.query(`ALTER TABLE "follows" DROP CONSTRAINT "FK_fdb91868b03a2040db408a53331"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_c5a322ad12a7bf95460c958e80e"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_7e8d7c49f218ebb14314fdb3749"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK_e44ddaaa6d058cb4092f83ad61f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_003e77538237089ff217a1cfe7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_31c935be539e76295a7f1c632a"`);
        await queryRunner.query(`DROP TABLE "post_hashtags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe0bb3f6520ee0469504521e71"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_831a5a06f879fb0bebf8965871"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ef463dd9a2ce0d673350e36e0f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdb91868b03a2040db408a5333"`);
        await queryRunner.query(`DROP TABLE "follows"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f7fdba1888c7acc68855dd33a4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfd8e81fac09d7339a32e57d90"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_46bc204f43827b6f25e0133dbf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5a322ad12a7bf95460c958e80"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b4ef8e83392129fb3373fdb3a"`);
        await queryRunner.query(`DROP TABLE "hashtags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e8d7c49f218ebb14314fdb374"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e44ddaaa6d058cb4092f83ad61"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
