import Mustache from 'mustache';
import Debug from 'debug';
import { FTSQuery, WarthogModel, ObjectType } from '../model';
import { upperFirst } from 'lodash';

const debug = Debug('qnode-cli:model-generator');

interface MustacheQuery {
    entities: MustacheOrmEnitity[],
    query: {
        name: string,
        language: string, 
        documents: MustacheQueryDocument[], // all text fields in a table are grouped into documents
        ts: number // migration timestamp
    }
}

interface MustacheOrmEnitity {
    type: string,
    table: string, // SQL table the enitity is mapped to
    name: string 
}

interface MustacheQueryDocument {
    index_col: string, // generated column to be used for the ts_vector index
    table: string, // SQL table the text fields belong to 
    fields: MustacheQueryField[] // text fields to be grouped into a document
}

interface MustacheQueryField {
    weight: string, // reserved; can be 'A', 'B', 'C' or 'D'. Always set to 'A' for now.
    column: string,  // SQL column this field is mapped to
    last: boolean // this field is need for joining, e.g. '<field> || <field> || <field>'
}

export class FTSQueryGenerator {
    _model: WarthogModel;
    
    public constructor(model: WarthogModel) {
        this._model = model;

    }

    generate(mustacheTeplate: string, query: FTSQuery):string {
        debug(`Generating query with ${JSON.stringify(query, null, 2)}`);
        const mustacheQuery = this.transform(query);
        return Mustache.render(mustacheTeplate, mustacheQuery);
    }

    private transform(query: FTSQuery): MustacheQuery {
        if (query.clauses.length == 0) {
            throw new Error("A query should contain at least one clause");
        }

        //const entityObjType = this.lookupType(query.fields[0]);
        const entities: MustacheOrmEnitity[] = [];
        const documents: MustacheQueryDocument[] = [];
        
        const name2doc: { [entity:string]: MustacheQueryDocument } = {};
        const name2entity: { [entity:string]: MustacheOrmEnitity } = {};

        query.clauses.map((v) => {
            if (!name2doc[v.entity.name]) {
                name2doc[v.entity.name] = {
                    index_col: `${query.name}_index_col`,
                    table: this.name2table(v.entity.name),
                    fields: []
                };
                name2entity[v.entity.name] = this.objectTypeToMustache(v.entity);
            }
            name2doc[v.entity.name].fields.push({
                column: this.name2column(v.field.name),
                weight: 'A',
                last: false
            });
            
        })

        Object.entries(name2doc).forEach(([entityName, doc]) => {
            entities.push(name2entity[entityName]);
            doc.fields[doc.fields.length - 1].last = true;
            documents.push(doc);
        })
        
        return {
            entities,
            query: {
                name: query.name,
                language: 'english',// only English is supported for now
                documents,
                ts: Date.now()
            }
        }
    }

    private objectTypeToMustache(objType: ObjectType): MustacheOrmEnitity {
        return {
            type: upperFirst(objType.name),
            table: this.name2table(objType.name), 
            name: objType.name
        }
    } 

    // TODO: hmm this really depends on typeorm naming strategy
    private name2column(name: string):string {
        return name.toLowerCase();
    }

    private name2table(name: string): string {
        return name.toLowerCase();
    }
}