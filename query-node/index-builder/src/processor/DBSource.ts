import { IProcessorSource, EventFilter } from './IProcessorSource';
import { SubstrateEvent } from '../model';
import { getRepository, MoreThan, In, FindConditions, Between } from 'typeorm';
import { SubstrateEventEntity } from '../entities';
import { Inject, Service } from 'typedi';
import { IndexerStatusService } from '../indexer';
import { getIndexerHead } from '../db';
import { EventEmitter } from 'events';

@Service('ProcessorSource')
export class DBSource extends EventEmitter implements IProcessorSource {
  

  constructor(@Inject() protected indexerService: IndexerStatusService = new IndexerStatusService()) {
    super();
  }


  subscribe(events: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  
  
  async indexerHead(): Promise<number> {
    return getIndexerHead();
  }

  async nextBatch(filter: EventFilter, size: number): Promise<SubstrateEvent[]> {
    //const indexerHead = await this.indexerService.getIndexerHead(); 
    const where: FindConditions<SubstrateEventEntity>[]= [{
      name: In(filter.names),
      blockNumber: Between(filter.fromBlock, filter.toBlock) 
    }]

    if (filter.afterID) {
      where.push({ id: MoreThan(filter.afterID) });
    }

    const eventEntities:SubstrateEventEntity[] = await getRepository(SubstrateEventEntity).find({ 
      relations: ["extrinsic"],
      where,
      order: {
        id: 'ASC'
      },
      take: size
    })
    return eventEntities.map(e => this.convert(e));
  }

  private convert(qee: SubstrateEventEntity): SubstrateEvent {
    return qee as SubstrateEvent;
  }
  
}