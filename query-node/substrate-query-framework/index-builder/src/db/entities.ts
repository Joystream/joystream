import { Entity, Column, PrimaryColumn } from 'typeorm';

/**
 * Represents the last processed event. Corresponding database table will only hold one record
 *  the single record will be updated accordingly
 */
@Entity()
export class SavedEntityEvent {
  // Index of the event. @polkadot/types/interfaces/EventId
  @PrimaryColumn()
  index!: number;

  // The actually event name without event section. Event.method
  @Column()
  eventName!: string;

  // Block number. Event emitted from this block.
  @Column()
  blockNumber!: number;

  // When the event is added to the database
  @Column('timestamp without time zone', {
    default: () => 'now()',
  })
  createdAt!: Date;

  constructor(init?: Partial<SavedEntityEvent>) {
    Object.assign(this, init);
  }
}
