import { FTSQuery } from './FTSQuery';
import { Field } from './Field';
import { GraphQLEnumType } from 'graphql';

export class WarthogModel {
  private _types: ObjectType[];
  private _ftsQueries: FTSQuery[];
  private _enums: GraphQLEnumType[] = [];
  private _interfaces: ObjectType[] = [];
  private _name2query: { [key: string]: FTSQuery } = {};
  private _name2type: { [key: string]: ObjectType } = {};

  constructor() {
    this._types = [];
    this._ftsQueries = [];
  }

  addObjectType(type: ObjectType): void {
    if (!type.isEntity) return;

    this._types.push(type);
    this._name2type[type.name] = type;
  }

  addFTSQuery(query: FTSQuery): void {
    if (!this._name2query[query.name]) {
      this._name2query[query.name] = query;
    }
    this._ftsQueries.push(query);
  }

  addInterface(_interface: ObjectType): void {
    this._interfaces.push(_interface);
  }

  addEnum(_enum: GraphQLEnumType): void {
    this._enums.push(_enum);
  }
  /**
   * Add emply full text search query with the given name
   *
   * @param name query name to be added
   */
  addEmptyFTSQuery(name: string): FTSQuery {
    const query = {
      name,
      clauses: [],
    };
    this.addFTSQuery(query);
    return query;
  }

  private _addQueryClause(name: string, f: Field, t: ObjectType): void {
    let q: FTSQuery = this._name2query[name];
    if (!q) {
      q = this.addEmptyFTSQuery(name);
    }
    q.clauses.push({
      entity: t,
      field: f,
    });
  }

  /**
   * Add text search field to the named FTS query
   *
   * @param queryName fulltext query name
   * @param fieldName name of the field to be added to the query
   * @param typeName  objectType which defined that field
   */
  addQueryClause(queryName: string, fieldName: string, typeName: string): void {
    const field = this.lookupField(typeName, fieldName);
    const objType = this.lookupType(typeName);
    this._addQueryClause(queryName, field, objType);
  }

  get types(): ObjectType[] {
    return this._types;
  }

  get ftsQueries(): FTSQuery[] {
    return this._ftsQueries;
  }

  get enums(): GraphQLEnumType[] {
    return this._enums;
  }

  get interfaces(): ObjectType[] {
    return this._interfaces;
  }

  lookupEnum(name: string): GraphQLEnumType {
    const e = this._enums.find(e => e.name === name);
    if (!e) throw new Error(`Cannot find enum with name ${name}`);
    return e;
  }

  lookupInterface(name: string): ObjectType {
    const e = this._interfaces.find(e => e.name === name);
    if (!e) throw new Error(`Cannot find interface with name ${name}`);
    return e;
  }

  lookupQuery(queryName: string): FTSQuery {
    if (!this._name2query) {
      throw new Error(`No query with name ${queryName} found`);
    }
    return this._name2query[queryName];
  }

  /**
   * Lookup Warthog's Field model object by it's ObjectType and name
   *
   * @param objTypeName Type name with the given field defined
   * @param name the name of the field
   */
  lookupField(objTypeName: string, name: string): Field {
    const objType = this.lookupType(objTypeName);
    const field = objType.fields.find(f => f.name === name);
    if (!field) {
      throw new Error(`No field ${name} is found for object type ${objTypeName}`);
    }
    return field;
  }

  addField(entity: string, field: Field): void {
    const objType = this.lookupType(entity);
    objType.fields.push(field);
  }

  /**
   * Lookup ObjectType by it's name (as defined in the schema file)
   *
   * @param name ObjectTypeName as defined in the schema
   */
  lookupType(name: string): ObjectType {
    if (!this._name2type[name]) {
      throw new Error(`No ObjectType ${name} found`);
    }
    return this._name2type[name];
  }
}

/**
 * Reperesent GraphQL object type
 */
export interface ObjectType {
  name: string;
  fields: Field[];
  isEntity: boolean;
  isInterface?: boolean;
  interfaces?: ObjectType[]; //interface names
}
