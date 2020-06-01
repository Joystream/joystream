import Mustache = require('mustache');
import Debug from 'debug';
import { FTSQuery, WarthogModel, ObjectType, Field } from '../model';

const debug = Debug('qnode-cli:model-generator');

interface MustacheQuery {
    entities: MustacheOrmEnitity[],
    query: {
        name: string,
        language: string, 
        index_col: string, // generated column to be used for the index
        fields: MustacheQueryField[],
        ts: number // migration timestamp
    }
}

interface MustacheOrmEnitity {
    type: string,
    table: string, // SQL table the enitity is mapped to
    name: string 
}

interface MustacheQueryField {
    column: string,  // SQL column this field is mapped to
    table: string, // SQL table this field mapped to 
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
        const fields: MustacheQueryField[] = [];
        const entities: MustacheOrmEnitity[] = [];
        
        query.clauses.map((v, i) => {
            fields.push({
               column: v.field.name,
               table: v.entity.name.toLowerCase(),
               last: i == query.clauses.length - 1
            })
            entities.push({
                name: v.entity.name.toLowerCase(),
                table: v.entity.name,
                type: v.entity.name
            })
        })
        
        return {
            entities,
            query: {
                name: query.name,
                index_col: `${query.name}_index_col`,
                language: 'english',// only English is supported for now
                fields,
                ts: Date.now()
            }
        }
    }

    // TODO: This is not needed any more as the query already has ObjectType 
    private lookupType(field: Field): ObjectType {
        const typeMatch = this._model.types.filter((t) => {
            const matches = t.fields.filter((f) => f === field);
            return matches.length > 0;
        })
        if (!typeMatch) {
            throw new Error(`No entity is defined with field ${field.name}`);
        }
        if (typeMatch.length > 1) {
            throw new Error(`An ambigous field name ${field.name} is defined for multiple enities`);
        }
        return typeMatch[0];
    }
}