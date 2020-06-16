import { ObjectTypeDefinitionNode, FieldDefinitionNode, ListTypeNode, NamedTypeNode } from 'graphql';
import { GraphQLSchemaParser, Visitors, SchemaNode } from './SchemaParser';
import { WarthogModel, Field, ObjectType } from '../model';
import Debug from 'debug';
import { DIRECTIVES } from './SchemaDirective';
import { ENTITY_DIRECTIVE } from './constant';

const debug = Debug('qnode-cli:model-generator');

/**
 * Parse a graphql schema and generate model defination strings for Warthog. It use GraphQLSchemaParser for parsing
 * @constructor(schemaPath: string)
 */
export class WarthogModelBuilder {
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

  private _listType(typeNode: ListTypeNode, fieldName: string): Field {
    let field: Field;

    if (typeNode.type.kind === 'ListType') {
      throw new Error('Only one level lists are allowed');
    } else if (typeNode.type.kind === 'NamedType') {
      field = this._namedType(fieldName, typeNode.type);
      field.isList = true;
    } else {
      if (typeNode.type.type.kind === 'ListType') {
        throw new Error('Only one level lists are allowed');
      }
      field = this._namedType(fieldName, typeNode.type.type);
      field.nullable = false;
    }

    field.isList = true;
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
    const entityDirective = o.directives?.find((d) => d.name.value === ENTITY_DIRECTIVE);
    return entityDirective ? true : false;
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
        const field =
          typeNode.type.kind === 'NamedType'
            ? this._namedType(fieldName, typeNode.type)
            : this._listType(typeNode.type, fieldName);

        field.nullable = false;
        return field;
      } else if (typeNode.kind === 'ListType') {
        return this._listType(typeNode, fieldName);
      } else {
        throw new Error(`Unrecognized type. ${JSON.stringify(typeNode, null, 2)}`);
      }
    });

    debug(`Read and parsed fields: ${JSON.stringify(fields, null, 2)}`);

    return { name: o.name.value, fields: fields, isEntity: this.isEntity(o) } as ObjectType;
  }

  /**
   * Add SQL OneToOne and ManyToOne relationship to object types if there is
   */
  generateSQLRelationships(): void {
    const additionalFields: { [key: string]: string | Field }[] = [];

    this._model.types.forEach(({ name, fields }) => {
      for (const field of fields) {
        if (!field.isBuildinType && field.isList) {
          const typeName = field.type;
          field.name = field.type.toLowerCase().concat('s');
          field.type = 'otm'; // OneToMany

          const newField = new Field(field.type, field.type);
          newField.isBuildinType = false;
          newField.nullable = false;
          newField.type = 'mto'; // ManyToOne
          newField.name = name.toLowerCase();
          additionalFields.push({ field: newField, name: typeName });
        }
      }
    });

    for (const objType of this._model.types) {
      for (const field of additionalFields) {
        if (objType.name === field.name) {
          objType.fields.push(field.field as Field);
        }
      }
    }
  }

  buildWarthogModel(): WarthogModel {
    this._model = new WarthogModel();

    this._schemaParser.getObjectDefinations().map((o) => {
      const objType = this.generateTypeDefination(o);
      this._model.addObjectType(objType);
    });

    this.generateSQLRelationships();

    const visitors: Visitors = {
      directives: {},
    };
    DIRECTIVES.map((d) => {
      visitors.directives[d.name] = {
        visit: (path: SchemaNode[]) => d.generate(path, this._model),
      };
    });
    this._schemaParser.dfsTraversal(visitors);

    return this._model;
  }
}
