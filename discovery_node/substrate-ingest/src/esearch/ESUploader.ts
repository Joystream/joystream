import Config from '../Config';
import { State, StateKeeper } from '../state/StateKeeper';
import { Client } from '@elastic/elasticsearch'
import QueryEventBlock from '../joynode/QueryEventBlock';

export default class ESUploader {
    private _client: Client;

    constructor(config: Config) {
        this._client = new Client({ node: config.get().elasticsearch.node })
    }

    async restore(): Promise<State> {
        const { body } = await this._client.search({
            index: 'processed-events',
            body: {
                size: 1,
                sort: { blockNumber: "desc", index: "desc" },
                query: {
                    match_all: {}
                }
            }    
        })
        if (!body.hits.hits ) {
            return StateKeeper.nullState()
        }
        return {
            lastProcessedBlock: body.hits.hits[0].blockNumber,
            eventIndex: body.hits.hits[0].index
        }
    }

    async process(eventBlock: QueryEventBlock) {
        const body = eventBlock.query_events.flatMap(
            (doc, i) => [{ index: { _index: 'processed-events' } }, 
            {   
                ...doc, 
                blockNumber: eventBlock.block_number,
                index: i
            }]
        );

        const { body: bulkResponse } = await this._client.bulk({ body });
        if (bulkResponse.errors) {
            const erroredDocuments: any[] = [];
            // The items array has the same order of the dataset we just indexed.
            // The presence of the `error` key indicates that the operation
            // that we did for the document has failed.
            bulkResponse.items.forEach((action:any, i:number) => {
              const operation = Object.keys(action)[0]
              if (action[operation].error) {
                erroredDocuments.push({
                  // If the status is 429 it means that you can retry the document,
                  // otherwise it's very likely a mapping error, and you should
                  // fix the document before to try it again.
                  status: action[operation].status,
                  error: action[operation].error,
                  operation: body[i * 2],
                  document: body[i * 2 + 1]
                })
              }
            })
            console.log(erroredDocuments)
        }
    }
}