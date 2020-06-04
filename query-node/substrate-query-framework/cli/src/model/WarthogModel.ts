import { FTSQuery } from './FTSQuery';
import { availableTypes } from './ScalarTypes'

export class WarthogModel {
    _types: ObjectType[];
    _ftsQueries: FTSQuery[];
    _name2query: { [key: string]: FTSQuery } = {};
    _name2type: { [key: string]: ObjectType } = {};

    constructor() {
        this._types = [];
        this._ftsQueries = [];
    }

    addObjectType(type: ObjectType): void {
        if (!type.isEntity) return;

        this._types.push(type);
        this._name2type[type.name] = type; 
    }

    addFTSQuery(query: FTSQuery):void {
        if (!this._name2query[query.name]) {
            this._name2query[query.name] = query;
        }
        this._ftsQueries.push(query);
    }

    addQueryField(name:string, f: Field, t?: ObjectType):void {
        let q: FTSQuery = this._name2query[name];
        if (!q) {
            q = {
                name,
                type: t,
                fields: []
            } as FTSQuery;
            this.addFTSQuery(q);
        }
        q.fields.push(f);
    }


    get types(): ObjectType[] {
        return this._types;
    }

    get ftsQueries(): FTSQuery[] {
        return this._ftsQueries;
    }

    lookupField(type: string, name: string): Field {
        const objType = this.lookupType(type);
        const field = objType.fields.find((f) => f.name === name);
        if (!field) {
            throw new Error(`No field ${name} is found for object type ${type}`);
        }
        return field;
    }

    lookupType(type: string): ObjectType {
        if (!this._name2type[type]) {
            throw new Error(`No ObjectType ${type} found`);
        }
        return this._name2type[type];
    }

    /**
     * Generate model defination as one-line string literal
     * Example: User username! age:int! isActive:bool!
     */
    toWarthogStringDefinitions(): string[] {
        const models = this._types.map(input => {
            const fields = input.fields.map(field => field.format()).join(' ');
            return [input.name, fields].join(' ');
        });
        return models;
    }

}


/**
* Reperesent GraphQL object type
*/
export interface ObjectType {
    name: string;
    fields: Field[];
    isEntity: boolean;
}


  
/**
 * Reperenst GraphQL object type field
 * @constructor(name: string, type: string, nullable: boolean = true, isBuildinType: boolean = true, isList = false)
 */
export class Field {
    // GraphQL field name
    name: string;
    // GraphQL field type
    type: string;
    // Is field type built-in or not
    isBuildinType: boolean;
    // Is field nullable or not
    nullable: boolean;
    // Is field a list. eg: post: [Post]
    isList: boolean;


    constructor(name: string, 
        type: string, 
        nullable = true, 
        isBuildinType = true, 
        isList = false) {
        this.name = name;
        this.type = type;
        this.nullable = nullable;
        this.isBuildinType = isBuildinType;
        this.isList = isList;
    }

    /**
     * Create a string from name, type properties in the 'name:type' format. If field is not nullable
     * it adds exclamation mark (!) at then end of string
     */
    format(): string {
    const colon = ':';
    const columnType: string = this.isBuildinType ? availableTypes[this.type] : this.type;
    let column: string = columnType === 'string' ? this.name : this.name.concat(colon, columnType);

    if (!this.isBuildinType && !this.isList && this.type !== 'otm' && this.type !== 'mto') {
      column = this.name.concat(colon, 'oto');
    } else if (this.isBuildinType && this.isList) {
      column = this.name + colon + 'array' + columnType;
        }
        return this.nullable ? column : column + '!';
    }
}
