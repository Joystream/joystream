import {
  parse,
  visit,
  buildASTSchema,
  GraphQLSchema,
  validateSchema,
  ObjectTypeDefinitionNode,
  FieldDefinitionNode,
  DirectiveNode
} from 'graphql';
import * as fs from 'fs-extra';
import Debug from "debug";
import { cloneDeep } from 'lodash';
import { DIRECTIVES } from './SchemaDirective'
import { SCHEMA_DEFINITIONS_PREAMBLE } from './constant';

const debug = Debug('qnode-cli:schema-parser');

export type SchemaNode = ObjectTypeDefinitionNode | FieldDefinitionNode | DirectiveNode;

export interface Visitor {
    /**
     * Generic visit function for the AST schema traversal. 
     * Only ObjectTypeDefinition and FieldDefinition nodes are included in the path during the 
     * traversal
     * 
     * May throw validation errors
     * 
     * @param path: DFS path in the schema tree ending at the directive node of interest
     */
    visit: (path: SchemaNode[]) => void
}

export interface Visitors {
    /**
     * A map from the node name to the Visitor
     * 
     * During a DFS traversal of the AST tree if a directive node
     * name matches the key in the directives map, the corresponding visitor is called
     */
    directives: { [name: string]: Visitor };
}

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
    if (!fs.existsSync(schemaPath)) {
        throw new Error('Schema not found');
    }
    const contents = fs.readFileSync(schemaPath, 'utf8');
    this.schema = GraphQLSchemaParser.buildSchema(contents);
    this._objectTypeDefinations = GraphQLSchemaParser.createObjectTypeDefinations(this.schema);
  }

  private static buildPreamble(): string {
      let preamble = SCHEMA_DEFINITIONS_PREAMBLE;
      DIRECTIVES.map((d) => preamble += (d.preamble + '\n'));
      return preamble;
  }
  /**
   * Read GrapqhQL schema and build a schema from it
   */
  static buildSchema(contents: string): GraphQLSchema {
    const schema = GraphQLSchemaParser.buildPreamble().concat(contents);
    const ast = parse(schema);
    // in order to build AST with undeclared directive, we need to 
    // switch off SDL validation
    const schemaAST = buildASTSchema(ast);

    const errors = validateSchema(schemaAST);

    if (errors.length > 0) {
      // There are errors
      let errorMsg = `Schema is not valid. Please fix the following errors: \n`;
      errors.forEach(e => errorMsg += `\t ${e.name}: ${e.message}\n`);
      debug(errorMsg);
      throw new Error(errorMsg);
    }

    return schemaAST;
  }

  /**
   * Get object type definations from the schema. Build-in and scalar types are excluded.
   */
  static createObjectTypeDefinations(schema: GraphQLSchema): ObjectTypeDefinitionNode[] {
    return [
      ...Object.values(schema.getTypeMap())
        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
        .filter(t => !t.name.match(/^__/) && !t.name.match(/Query/)) // skip the top-level Query type
        .sort((a, b) => (a.name > b.name ? 1 : -1))
        .map(t => t.astNode)
    ]
      .filter(Boolean) // Remove undefineds and nulls
      .filter(typeDefinationNode => typeDefinationNode?.kind === 'ObjectTypeDefinition') as ObjectTypeDefinitionNode[];
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

  /**
   * DFS traversal of the AST
   */
  dfsTraversal(visitors: Visitors): void {
    // we traverse starting from each definition 
    this._objectTypeDefinations.map((objType) => {
        const path: SchemaNode[] = [];
        visit(objType, {
            enter: (node) => {
                if (node.kind !== 'Directive' && 
                    node.kind !== 'ObjectTypeDefinition' && 
                    node.kind !== 'FieldDefinition') {
                        // skip non-definition fields;
                        return false;
                }
                path.push(node);
                if (node.kind === 'Directive') {
                    if (node.name.value in visitors.directives) {
                        (visitors.directives[node.name.value]).visit(cloneDeep(path))
                    }
                } 
               
            },
            leave: () => path.pop()
        })
    })
  }
}
