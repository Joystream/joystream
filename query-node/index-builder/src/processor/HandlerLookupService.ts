import { Inject, Service } from 'typedi';
import { QueryEventProcessingPack, EventHandlerFunc } from '../model';
import { ProcessorOptions } from '../node';
import Debug from 'debug';
// Get the even name from the mapper name. By default, we assume the handlers
// are of the form <section>_<method> which is translated into the canonical event name of the 
// form <section>.<method>
const DEFAULT_MAPPINGS_TRANSLATOR = (m: string) => `${m.split('_')[0]}.${m.split('_')[1]}`;

const debug = Debug('index-builder:processor');

@Service()
export class HandlerLookupService {
  private _events: string[] = [];
  private _event2mapping: { [e: string]: EventHandlerFunc } = {};
  private _processingPack: QueryEventProcessingPack;
  private _translator = DEFAULT_MAPPINGS_TRANSLATOR;
  
  constructor(@Inject('ProcessorOptions') protected options: ProcessorOptions) {
    this._processingPack = this.options.processingPack;
    this._translator = this.options.mappingToEventTranslator || DEFAULT_MAPPINGS_TRANSLATOR;
    this._events = Object.keys(this._processingPack).map((mapping:string) => this._translator(mapping));
    Object.keys(this._processingPack).map((m) => {
      this._event2mapping[this._translator(m)] = this._processingPack[m];
    })

    debug(`The following events will be processed: ${JSON.stringify(this._events, null, 2)}`);

  }

  eventsToHandle(): string[] {
    return this._events;
  }

  lookupHandler(eventName: string): EventHandlerFunc {
    return this._event2mapping[eventName]
  }



}