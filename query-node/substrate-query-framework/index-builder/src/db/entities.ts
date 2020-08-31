import { Entity, Column, EntityManager, PrimaryGeneratedColumn, ValueTransformer, getConnection } from 'typeorm';
import { SubstrateEvent } from '..';
import * as BN from 'bn.js';

export class NumericTransformer implements ValueTransformer {
  /**
   * Used to marshal data when writing to the database.
   */
  to(value: BN): string {
    return value ? value.toString() : value;
  }
  /**
   * Used to unmarshal data when reading from the database.
   */
  from(value: string): BN {
    return new BN(value);
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
  @Column()
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
  updatedAt!: Date;

  constructor(init?: Partial<SavedEntityEvent>) {
    Object.assign(this, init);
  }

  /**
   * Get the single database record or create a new instance and then update entity properties
   * with the event parameter
   * @param event
   */
  static async update(event: SubstrateEvent, manager: EntityManager): Promise<SavedEntityEvent> {
    let lastProcessedEvent = await manager.findOne(SavedEntityEvent, { where: { id: 1 } });

    if (!lastProcessedEvent) {
      lastProcessedEvent = new SavedEntityEvent();
    }

    lastProcessedEvent.index = event.index;
    lastProcessedEvent.eventName = event.event_name;
    lastProcessedEvent.blockNumber = event.block_number;
    lastProcessedEvent.updatedAt = new Date();

    return await manager.save(lastProcessedEvent);
  }

  static async createTable(): Promise<void> {
    const query = `CREATE TABLE IF NOT EXISTS "saved_entity_event" (
      "id" integer PRIMARY KEY DEFAULT 1,
      "index" numeric,
      "event_name" character varying NOT NULL,
      "block_number" numeric NOT NULL,
      "updated_at" TIMESTAMP NOT NULL DEFAULT now())`;
    // get a connection and create a new query runner
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query(query);
    await queryRunner.release();
  }
}
