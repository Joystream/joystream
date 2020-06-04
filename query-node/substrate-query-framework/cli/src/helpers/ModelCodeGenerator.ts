import { ObjectTypeDefinitionNode, FieldDefinitionNode, ListTypeNode, NamedTypeNode } from 'graphql';
import { GraphQLSchemaParser, Visitors, SchemaNode } from './SchemaParser';
import { WarthogModel, Field, ObjectType } from '../model';
import Debug from 'debug';
import { DIRECTIVES } from './SchemaDirective';
import { ENTITY_DIRECTIVE } from './constant'

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
  private _namedType(name: string, namedTypeNode: NamedTypeNode): Field {
    const field = new Field(name, namedTypeNode.name.value);
    field.isBuildinType = this._isBuildinType(field.type);

    return field;
  }

  /**
   * Mark the object type as entity if '@entity' directive is used
   * @param o ObjectTypeDefinitionNode
   */
  private isEntity(o: ObjectTypeDefinitionNode): boolean {
    const entityDirective = o.directives?.find(d => d.name.value === ENTITY_DIRECTIVE)
    return entityDirective ? true : false
  }


  /**
   * Generate a new ObjectType from ObjectTypeDefinitionNode
   * @param o ObjectTypeDefinitionNode
   */
  private generateTypeDefination(o: ObjectTypeDefinitionNode): ObjectType {
    const fields = this._schemaParser.getFields(o).map((fieldNode: FieldDefinitionNode) => {
      const typeNode = fieldNode.type;
      const fieldName = fieldNode.name.value;
      
      if (typeNode.kind === 'NamedType') {
        return this._namedType(fieldName, typeNode);
      } else if (typeNode.kind === 'NonNullType') {
        if (typeNode.type.kind === 'NamedType') {
          // It is named type. and nullable will be set false
          const field = this._namedType(fieldName, typeNode.type);
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

    return { name: o.name.value, fields: fields, isEntity: this.isEntity(o) } as ObjectType;
  }

  generateWarthogModel(): WarthogModel {
    this._model = new WarthogModel();

    this._schemaParser.getObjectDefinations().map(o => {
        const objType = this.generateTypeDefination(o);
        this._model.addObjectType(objType)
    });

    const visitors: Visitors = {
        directives: {}
    };
    DIRECTIVES.map((d) => {
        visitors.directives[d.name] = {
            visit: (path: SchemaNode[]) => d.generate(path, this._model)
        }
    })
    this._schemaParser.dfsTraversal(visitors);
    
    return this._model;
  }

}
