import Mustache from 'mustache';
import Debug from 'debug';
import { FTSQuery, ObjectType } from '../model';
import { upperFirst, lowerFirst, kebabCase } from 'lodash';
import { snakeCase } from 'typeorm/util/StringUtils';
import { GeneratorContext } from '../generate/SourcesGenerator';

const debug = Debug('qnode-cli:model-generator');

interface MustacheQuery {
    entities: MustacheOrmEnitity[],
    query: {
        name: string,
        typePrefix: string, // used to define types for inputs and outputs
        viewName: string, // view name holding the union of the documents
        language: string, 
        documents: MustacheQueryDocument[], // all text fields in a table are grouped into documents
        ts: number // migration timestamp
    }
}

interface MustacheOrmEnitity {
    type: string,
    fieldName: string,
    arrayName: string,
    table: string, // SQL table the enitity is mapped to
    model: string,  // warthog model name
    last: boolean
}

interface MustacheQueryDocument {
    tsvColumn: string, // generated column to be used for the ts_vector index
    docColumn: string, // generated column where the concatenated fields as a doc are stored
    index_name: string, // name of the ts_vector index
    table: string, // SQL table the text fields belong to 
    fields: MustacheQueryField[] // text fields to be grouped into a document
    last: boolean // if its last in the list of documents
}

interface MustacheQueryField {
    weight: string, // reserved; can be 'A', 'B', 'C' or 'D'. Always set to 'A' for now.
    column: string,  // SQL column this field is mapped to
    last: boolean // this field is need for joining, e.g. '<field> || <field> || <field>'
}



export class FTSQueryGenerator {
    private _context: GeneratorContext = {};

    constructor(context: GeneratorContext = {}) {
        this._context = context;
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

        const prefix = this.queryName2prefix(query.name);

        //const entityObjType = this.lookupType(query.fields[0]);
        const entities: MustacheOrmEnitity[] = [];
        const documents: MustacheQueryDocument[] = [];
        
        const name2doc: { [entity:string]: MustacheQueryDocument } = {};
        const name2entity: { [entity:string]: MustacheOrmEnitity } = {};

        query.clauses.map((v) => {
            if (!name2doc[v.entity.name]) {
                const table = this.name2table(v.entity.name);
                name2doc[v.entity.name] = {
                    tsvColumn: `${prefix}_tsv`,
                    docColumn: `${prefix}_doc`,
                    index_name: `${prefix}_${table}_idx`,
                    table,
                    fields: [],
                    last: false
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
        
        documents[documents.length - 1].last = true;
        entities[entities.length - 1].last = true;
        
        return {
            entities,
            query: {
                viewName: `${prefix}_view`,
                typePrefix: upperFirst(query.name),
                name: query.name,
                language: 'english',// only English is supported for now
                documents,
                ts: (this._context["ts"]) ? this._context["ts"] as number : Date.now()
            }
        }
    }

    private objectTypeToMustache(objType: ObjectType): MustacheOrmEnitity {
        return {
            type: upperFirst(objType.name),
            table: this.name2table(objType.name), 
            model: this.name2modelName(objType.name),
            fieldName: this.fieldName(objType.name),
            arrayName: this.arrayName(objType.name),
            last: false
        }
    } 

    // TODO: hmm this really depends on typeorm naming strategy
    private name2column(name: string):string {
        return `"${name}"`;
    }

    private name2table(name: string): string {
        return snakeCase(name);
    }

    private queryName2prefix(qName: string): string {
        return snakeCase(qName);
    }

    private name2modelName(name: string): string {
        return kebabCase(name);
    }

    private fieldName(name: string): string {
        return lowerFirst(name);
    }

    private arrayName(name: string): string {
        return `${this.fieldName(name)}s`;
    }
}