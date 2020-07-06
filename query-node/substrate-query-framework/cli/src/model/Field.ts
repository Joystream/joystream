import { availableTypes } from './ScalarTypes';

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
  // If this field if of union type
  _isUnion: boolean;
  // If this field is of enum type
  _isEnum: boolean;
  // Is field a list. eg: post: [Post]
  isList: boolean;
  // Description of the field will be shown in GrapqQL API
  description?: string;
  // Make field as a unique column on database
  unique?: boolean;

  constructor(name: string, type: string, nullable = true, isBuildinType = true, isList = false, isUnion = false, isEnum = false) {
    this.name = name;
    this.type = type;
    this.nullable = nullable;
    this.isBuildinType = isBuildinType;
    this.isList = isList;
    this._isUnion = isUnion;
    this._isEnum = isEnum;
  }

  columnType(): string {
    return this.isBuildinType ? availableTypes[this.type] : this.type;
  }

  isArray(): boolean {
    return this.isBuildinType && this.isList;
  }

  isScalar(): boolean {
    return this.isBuildinType && !this.isList;
  }

  isRelationType(): boolean {
    return ['otm', 'mto', 'oto'].some(s => s === this.type);
  }

  isEnum(): boolean {
    return this._isEnum;
  }
  
  isUnion(): boolean {
    return this._isUnion;
  }
}
