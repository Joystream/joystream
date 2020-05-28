import { ObjectTypeDefinitionNode, FieldDefinitionNode, ListTypeNode, NamedTypeNode, DirectiveNode, ArgumentNode, StringValueNode } from 'graphql';
import { GraphQLSchemaParser } from './SchemaParser';
import { WarthogModel, Field, ObjectType, FULL_TEXT_SEARCHABLE_DIRECTIVE } from './WarthhogModel';
import Debug from 'debug';

const debug = Debug('qnode-cli:model-generator');

/**
 * Parse a graphql schema and generate model defination strings for Warthog. It use GraphQLSchemaParser for parsing
 * @constructor(schemaPath: string)
 */
export class DatabaseModelCodeGenerator {
  private _schemaParser: GraphQLSchemaParser;
  private _model: WarthogModel;

  constructor(schemaPath: string) {
    this._schemaParser = new GraphQLSchemaParser(schemaPath);
    this._model = new WarthogModel();
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

    const field = new Field(fieldNode.name.value, '');

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
   * @param directives: additional directives of FieldDefinitionNode
   */
  private _namedType(name: string, namedTypeNode: NamedTypeNode, directives?: ReadonlyArray<DirectiveNode>): Field {
    const field = new Field(name, namedTypeNode.name.value);
    field.isBuildinType = this._isBuildinType(field.type);
    // TODO: we should really handle levels at the type definition level?
    if (directives) {
        directives.map((d:DirectiveNode) => this._processFieldDirective(d, field));
    }
    
    return field;
  }

  /**
   * 
   * @param d Directive provided to the FieldDefinitionNode
   * @param f WarthogModel field
   */
  private _processFieldDirective(d: DirectiveNode, f: Field) {
    if (d.name.value.includes(FULL_TEXT_SEARCHABLE_DIRECTIVE)) {
        const queryName = this._checkFullTextSearchDirective(d);
        this._model.addQueryField(queryName, f);
    }
  }

  /**
   * TODO: this piece should be refactored and does not seem to belong to this class
   * 
   * Does the checks and returns full text query names to be used;
   * 
   * @param d Directive Node
   * @returns Fulltext query names 
   */
  private _checkFullTextSearchDirective(d: DirectiveNode): string {
      if (!d.arguments) {
          throw new Error(`@${FULL_TEXT_SEARCHABLE_DIRECTIVE} should have a query argument`)
      }

      const qarg: ArgumentNode[] = d.arguments.filter((arg) => (arg.name.value === `query`) && (arg.value.kind === `StringValue`))
      
      if (qarg.length !== 1) {
          throw new Error(`@${FULL_TEXT_SEARCHABLE_DIRECTIVE} should have a single query argument with a sting value`);
      }
      return (qarg[0].value as StringValueNode).value;
    }

  /**
   * Generate a new ObjectType from ObjectTypeDefinitionNode
   * @param o ObjectTypeDefinitionNode
   */
  private generateTypeDefination(o: ObjectTypeDefinitionNode): ObjectType {
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
        throw new Error(`Unrecognized type. ${JSON.stringify(typeNode, null, 2)}`);
      }
    });

    debug(`Read and parsed fields: ${JSON.stringify(fields, null, 2)}`)

    return { name: o.name.value, fields: fields } as ObjectType;
  }

  generateWarthogModel(): WarthogModel {
    this._model = new WarthogModel();

    this._schemaParser.getObjectDefinations().map(o => {
        const objType = this.generateTypeDefination(o);
        this._model.addObjectType(objType)
    });

    return this._model;
  }

}
