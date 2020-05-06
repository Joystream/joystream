import { Entity, Column, PrimaryColumn, getRepository } from 'typeorm';
import { QueryEvent } from '..';

/**
 * Represents the last processed event. Corresponding database table will hold only one record
 *  and the single record will be updated
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

  /**
   * Get the single database record or create a new instance and then update entity properties
   * with the event parameter
   * @param event
   */
  static async updateOrCreate(event: QueryEvent): Promise<SavedEntityEvent> {
    let savedEE = await getRepository(SavedEntityEvent).findOne();
    if (!savedEE) {
      savedEE = new SavedEntityEvent();
    }
    savedEE.index = event.index;
    savedEE.eventName = event.event_method;
    savedEE.blockNumber = event.block_number;
    return savedEE;
  }
}
