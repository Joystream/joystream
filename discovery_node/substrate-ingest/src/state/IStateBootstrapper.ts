import { EventEmitter } from 'events';
import { State } from './StateKeeper';
import QueryEventBlock from '../joynode/QueryEventBlock';
import QueryEvent from '../joynode/QueryEvent';

export default interface IStateBootstrapper extends EventEmitter {
    bootstrap: () => Promise<State>;
    restore: () => Promise<State>;
    process: (event: QueryEventBlock) => Promise<State>;
    nextBlock: () => Promise<QueryEvent>;
}
