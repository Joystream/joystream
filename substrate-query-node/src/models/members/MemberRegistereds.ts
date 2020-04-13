import { Column, Entity, Index } from "typeorm";

@Index("PK_0b13cb7ccd19cd85d37a280561f", ["id"], { unique: true })
@Entity("member_registereds", { schema: "public" })
export class MemberRegistereds {
  @Column("character varying", { primary: true, name: "id" })
  id: string;

  @Column("timestamp without time zone", {
    name: "created_at",
    default: () => "now()",
  })
  createdAt: Date;

  @Column("integer", { name: "version", default: 1 })
  version: number;

  @Column("integer", { name: "member_id" })
  memberId: number;

  @Column("character varying", { name: "account_id" })
  accountId: string;

  @Column("timestamp without time zone", { name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @Column("timestamp without time zone", {
    name: "updated_at",
    nullable: true,
    default: () => "now()",
  })
  updatedAt: Date | null;

  @Column("character varying", { name: "updated_by_id", nullable: true })
  updatedById: string | null;

  @Column("character varying", { name: "deleted_by_id", nullable: true })
  deletedById: string | null;

  @Column("character varying", { name: "created_by_id", default: "1" })
  createdById: string;
}
