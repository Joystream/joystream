import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class EventHistory {
  @PrimaryColumn()
  index!: number;

  @Column()
  eventName!: string;

  @Column()
  blockNumber!: number;

  @Column('timestamp without time zone', {
    default: () => 'now()',
  })
  createdAt!: Date;
}
