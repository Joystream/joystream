import { ObjectTypeDefinitionNode, FieldDefinitionNode, ListTypeNode, NamedTypeNode, DirectiveNode, ArgumentNode, StringValueNode } from 'graphql';
import { GraphQLSchemaParser } from './SchemaParser';

const debug = require('debug')('qnode-cli:model-generator');

// Available types for model code generation
export const availableTypes: { [key: string]: string } = {
  String: '',
  Int: 'int',
  Boolean: 'bool',
  Date: 'date',
  Float: 'float'
};

export const FULL_TEXT_SEARCHABLE_DIRECTIVE = 'fullTextSearchable';

/**
 * Reperesent GraphQL object type
 */
interface ObjectType {
  name: string;
  fields: Field[];
}

/**
 * Reperenst GraphQL object type field
 * @constructor(name: string, type: string, nullable: boolean = true, isBuildinType: boolean = true, isList = false)
 */
class Field {
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
  // an array of fulltext query names 
  // to which this field should be included
  fullTextSearch: string[] = [];

  constructor(name: string, 
    type: string, 
    nullable: boolean = true, 
    isBuildinType: boolean = true, 
    isList = false,
    fullTextSearch: string[] = []) {
    this.name = name;
    this.type = type;
    this.nullable = nullable;
    this.isBuildinType = isBuildinType;
    this.isList = isList;
    this.fullTextSearch = fullTextSearch;
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

/**
 * Parse a graphql schema and generate model defination strings for Warthog. It use GraphQLSchemaParser for parsing
 * @constructor(schemaPath: string)
 */
export class DatabaseModelCodeGenerator {
  private _schemaParser: GraphQLSchemaParser;

  constructor(schemaPath: string) {
    this._schemaParser = new GraphQLSchemaParser(schemaPath);
  }

  /**
   * Returns true if type is Scalar, String, Int, Boolean, Float otherwise false
   * Scalar types are also built-in
   */
  private _isBuildinType(type: string): boolean {
    return !this._schemaParser.getTypeNames().includes(type);
  }

  // NOT IMPLEMENTED YET!
  private _listType(fieldNode: FieldDefinitionNode): Field {
    const typeNode = fieldNode.type as ListTypeNode;

    let field = new Field(fieldNode.name.value, '');

    if (typeNode.type.kind === 'NamedType') {
      field.type = typeNode.type.name.value;
      field.nullable = true;
      field.isList = true;
    } else if (typeNode.type.kind === 'NonNullType') {
      if (typeNode.type.type.kind === 'NamedType') {
        field.type = typeNode.type.type.name.value;
        field.nullable = false;
      }
    } else {
      // It is a list
    }
    field.isBuildinType = this._isBuildinType(field.type);
    return field;
  }

  /**
   * Create a new Field type from NamedTypeNode
   * @param name string
   * @param namedTypeNode NamedTypeNode
   */
  private _namedType(name: string, namedTypeNode: NamedTypeNode, directives?: ReadonlyArray<DirectiveNode>): Field {
    const field = new Field(name, namedTypeNode.name.value);
    field.isBuildinType = this._isBuildinType(field.type);
    if (directives) {
        directives.map((d:DirectiveNode) => {
            if (d.name.value.includes(FULL_TEXT_SEARCHABLE_DIRECTIVE)) {
                let query = this._checkFullTextSearchDirective(d);
                field.fullTextSearch.push(query);
            }
        })
    }
    
    return field;
  }

  /**
   * Does the checks and returns full text query names to be used;
   * 
   * @param d Directive Node
   * @returns Fulltext query names 
   */
  private _checkFullTextSearchDirective(d: DirectiveNode): string {
      if (!d.arguments) {
          throw new Error(`@${FULL_TEXT_SEARCHABLE_DIRECTIVE} should have a query argument`)
      }

      let qarg: ArgumentNode[] = d.arguments.filter((arg) => (arg.name.value === `query`) && (arg.value.kind === `StringValue`))
      
      if (qarg.length !== 1) {
          throw new Error(`@${FULL_TEXT_SEARCHABLE_DIRECTIVE} should have a single query argument with a sting value`);
      }
      return (qarg[0].value as StringValueNode).value;
    }

  /**
   * Generate a new ObjectType from ObjectTypeDefinitionNode
   * @param o ObjectTypeDefinitionNode
   */
  generateTypeDefination(o: ObjectTypeDefinitionNode): ObjectType {
    const fields = this._schemaParser.getFields(o).map((fieldNode: FieldDefinitionNode) => {
      const typeNode = fieldNode.type;
      const fieldName = fieldNode.name.value;
      const directives = fieldNode.directives;

      if (typeNode.kind === 'NamedType') {
        return this._namedType(fieldName, typeNode, directives);
      } else if (typeNode.kind === 'NonNullType') {
        if (typeNode.type.kind === 'NamedType') {
          // It is named type. and nullable will be set false
          const field = this._namedType(fieldName, typeNode.type, directives);
          field.nullable = false;
          return field;
        } else {
          throw new Error('ListType is not supported yet.');
        }
      } else if (typeNode.kind === 'ListType') {
        throw new Error('ListType is not supported yet.');
      } else {
        throw new Error(`Unrecognized type. ${typeNode}`);
      }
    });

    debug(`Read and parsed fields: ${JSON.stringify(fields, null, 2)}`)

    return { name: o.name.value, fields: fields } as ObjectType;
  }

  /**
   * Generate model defination as one-line string literal
   * Example: User username! age:int! isActive:bool!
   */
  generateModelDefinationsForWarthog(): string[] {
    const objectTypes = this._schemaParser.getObjectDefinations().map(o => this.generateTypeDefination(o));

    const models = objectTypes.map(input => {
      const fields = input.fields.map(field => field.format()).join(' ');
      return [input.name, fields].join(' ');
    });
    return models;
  }
}
