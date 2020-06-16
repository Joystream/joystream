import { Entity, Column, EntityManager, PrimaryGeneratedColumn, ValueTransformer } from 'typeorm';
import { SubstrateEvent } from '..';
import * as BN from 'bn.js';

class NumericTransformer implements ValueTransformer {
      /**
     * Used to marshal data when writing to the database.
     */
    to(value: BN): string {
      return value.toString()
    }
    /**
     * Used to unmarshal data when reading from the database.
     */
    from(value: string): BN {
      return new BN(value)
    }
}


/**
 * Represents the last processed event. Corresponding database table will hold only one record
 *  and the single record will be updated
 */
@Entity()
export class SavedEntityEvent {
  @PrimaryGeneratedColumn()
  id!: number;

  // Index of the event. @polkadot/types/interfaces/EventId
  @Column({ type: 'numeric', transformer: new NumericTransformer()})
  index!: BN;

  // The actually event name without event section. Event.method
  @Column()
  eventName!: string;

  // Block number. Event emitted from this block.
  @Column({ type: 'numeric', transformer: new NumericTransformer() })
  blockNumber!: BN;

  // When the event is added to the database
  @Column('timestamp without time zone', {
    default: () => 'now()',
  })
  updatedAt!: Date;

  constructor(init?: Partial<SavedEntityEvent>) {
    Object.assign(this, init);
  }

  /**
   * Get the single database record or create a new instance and then update entity properties
   * with the event parameter
   * @param event
   */
  static async update(event: SubstrateEvent, manager: EntityManager): Promise<void> {
    let lastProcessedEvent = await manager.findOne(SavedEntityEvent, { where: { id: 1 } });

    if (!lastProcessedEvent) {
      lastProcessedEvent = new SavedEntityEvent();
    }

    lastProcessedEvent.index = event.index;
    lastProcessedEvent.eventName = event.event_method;
    lastProcessedEvent.blockNumber = event.block_number;
    lastProcessedEvent.updatedAt = new Date();

    await manager.save(lastProcessedEvent);
  }
}
