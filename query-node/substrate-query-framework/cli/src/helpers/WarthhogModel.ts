
// Available types for model code generation
export const availableTypes: { [key: string]: string } = {
    String: '',
    Int: 'int',
    Boolean: 'bool',
    Date: 'date',
    Float: 'float'
  };
  
export const FULL_TEXT_SEARCHABLE_DIRECTIVE = 'fullTextSearchable';
  

export class WarthogModel {
    _types: ObjectType[];
    _ftsQueries: FTSQuery[];
    _name2query: { [key: string]: FTSQuery } = {};

    constructor() {
        this._types = [];
        this._ftsQueries = [];
    }

    addObjectType(type: ObjectType):void {
        this._types.push(type);
    }

    addFTSQuery(query: FTSQuery):void {
        if (!this._name2query[query.name]) {
            this._name2query[query.name] = query;
        }
        this._ftsQueries.push(query);
    }

    addQueryField(name:string, f: Field):void {
        let q: FTSQuery = this._name2query[name];
        if (!q) {
            q = {
                name,
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
}

/**
 * Represnts Fulltext search query as defined by
 *  fields in GraphGL  decorated with FULL_TEXT_SEARCHABLE_DIRECTIVE directive
 */
export interface FTSQuery {
    name: string;
    fields: Field[];
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
        let column: string;
        const columnType = this.isBuildinType ? availableTypes[this.type] : this.type;

        if (columnType === '') {
        // String type is provided implicitly
        column = this.name;
        } else {
        column = this.name + ':' + columnType;
        }
        return this.nullable ? column : column + '!';
    }
}