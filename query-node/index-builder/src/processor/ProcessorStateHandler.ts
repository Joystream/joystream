import { loadState } from '../db/dal';
import Debug from 'debug';
import assert = require('assert');
import { ProcessedEventsLogEntity } from '../entities';
import { getRepository } from 'typeorm';
import { Service } from 'typedi';

const debug = Debug('index-builder:processor-state-handler');

export interface IProcessorState {
  lastProcessedEvent: string | undefined
  lastScannedBlock: number 
}

export interface IProcessorStateHandler {
  persist(state: IProcessorState): Promise<void>;
  init(fromBlock?: number): Promise<IProcessorState>;
}

@Service('ProcessorStateHander')
export class ProcessorStateHandler implements IProcessorStateHandler {
  
  constructor(public readonly processorID = 'hydra-processor') {

  }

  async persist(state: IProcessorState): Promise<void> {
    assert (state.lastProcessedEvent, 'Cannot persist undefined event ID')
    const processed = new ProcessedEventsLogEntity();
    processed.processor = this.processorID;
    processed.eventId = state.lastProcessedEvent;
    processed.lastScannedBlock = state.lastScannedBlock;
    
    await getRepository('ProcessedEventsLogEntity').save(processed);
  }
  
  async init(atBlock = 0): Promise<IProcessorState> {
    
    if (atBlock > 0) {
      debug(`Got block height hint: ${atBlock}`);
    }
    
    const lastState = await loadState(this.processorID);

    if (lastState) {
      debug(`Found the most recent processed event ${lastState.eventId}`);
      if (atBlock > lastState.lastScannedBlock) {
        debug(
          `WARNING! Existing processed history detected on the database!
          Last processed event id ${lastState.eventId}. The indexer 
          will continue from block ${lastState.lastScannedBlock} and ignore the block height hint.`
        );
      }
      return { lastProcessedEvent: lastState.eventId, lastScannedBlock: lastState.lastScannedBlock}
    }

    return {
      lastScannedBlock: atBlock,
      lastProcessedEvent: undefined
    } 
    
  }
}