import {
  parse,
  visit,
  buildASTSchema,
  GraphQLSchema,
  validateSchema,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode
} from 'graphql';
import * as fs from 'fs-extra';

/**
 * Parse GraphQL schema
 * @constructor(schemaPath: string)
 */
export class GraphQLSchemaParser {
  // GraphQL shchema
  schema: GraphQLSchema;
  // List of the object types defined in schema
  private _objectTypeDefinations: ObjectTypeDefinitionNode[];

  constructor(schemaPath: string) {
    this.schema = GraphQLSchemaParser.buildSchema(schemaPath);
    this._objectTypeDefinations = GraphQLSchemaParser.createObjectTypeDefinations(this.schema);
  }

  /**
   * Read GrapqhQL schema from file and build a schema from it
   */
  static buildSchema(schemaPath: string): GraphQLSchema {
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema not found');
    }
    const ast = parse(fs.readFileSync(schemaPath, 'utf8'));
    // in order to build AST with undeclared directive, we need to 
    // switch off SDL validation
    const schema = buildASTSchema(ast, { assumeValidSDL : true });

    const errors = validateSchema(schema);

    // Ignore Query type if not defined in the schema
    if (errors.length > 1) {
      // There are errors
      console.error(`Schema is not valid. Please fix following errors: \n`);
      // Ignore first element which is Query type error
      errors.slice(1).forEach(e => console.log(`\t ${e.name}: ${e.message}`));
      console.log();
      process.exit(1);
    }

    return schema;
  }

  /**
   * Get object type definations from the schema. Build-in and scalar types are excluded.
   */
  static createObjectTypeDefinations(schema: GraphQLSchema): ObjectTypeDefinitionNode[] {
    return [
      ...Object.values(schema.getTypeMap())
        .filter(t => !t.name.match(/^__/))
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .map(t => t.astNode)
    ]
      .filter(Boolean) // Remove undefineds and nulls
      .filter(typeDefinationNode => typeDefinationNode!.kind === 'ObjectTypeDefinition') as ObjectTypeDefinitionNode[];
  }

  /**
   * Returns fields for a given GraphQL object
   * @param objDefinationNode ObjectTypeDefinitionNode
   */
  getFields(objDefinationNode: ObjectTypeDefinitionNode): FieldDefinitionNode[] {
    if (objDefinationNode.fields) return [...objDefinationNode.fields];
    return [];
  }

  /**
   * Returns GraphQL object names
   */
  getTypeNames(): string[] {
    return this._objectTypeDefinations.map(o => o.name.value);
  }

  /**
   * Returns GraphQL object type definations
   */
  getObjectDefinations(): ObjectTypeDefinitionNode[] {
    return this._objectTypeDefinations;
  }
}
