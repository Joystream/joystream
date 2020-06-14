import { Entity, Column, PrimaryColumn, EntityManager } from 'typeorm';
import { SubstrateEvent } from '..';

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
  static async update(event: SubstrateEvent, manager: EntityManager): Promise<void> {
    let lastProcessedEvent = await manager
      .getRepository(SavedEntityEvent)
      .createQueryBuilder('saved_entity_event')
      .select()
      .limit(1)
      .setLock('pessimistic_read')
      .getOne();

    if (lastProcessedEvent) {
      await manager
        .getRepository(SavedEntityEvent)
        .createQueryBuilder()
        .setLock('pessimistic_write')
        .update()
        .set({ index: event.index, eventName: event.event_method, blockNumber: event.block_number })
        .execute();
    } else {
      lastProcessedEvent = new SavedEntityEvent({
        index: event.index,
        eventName: event.event_method,
        blockNumber: event.block_number,
      });

      await manager
        .getRepository(SavedEntityEvent)
        .createQueryBuilder()
        .setLock('pessimistic_write')
        .insert()
        .into(SavedEntityEvent)
        .values(lastProcessedEvent)
        .execute();
    }
  }
}
