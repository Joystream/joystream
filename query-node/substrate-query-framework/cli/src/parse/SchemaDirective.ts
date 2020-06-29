import { SchemaNode } from './SchemaParser';
import { WarthogModel } from '../model';

export const FULL_TEXT_SEARCHABLE_DIRECTIVE = 'fulltext';

export interface DirectiveVisitor {
  // directive name to watch
  directiveName: string;
  /**
   * Generic visit function for the AST schema traversal.
   * Only ObjectTypeDefinition and FieldDefinition nodes are included in the path during the
   * traversal
   *
   * May throw validation errors
   *
   * @param path: BFS path in the schema tree ending at the directive node of interest
   */
  visit: (path: SchemaNode[]) => void;
}

export interface SchemaDirective {
  // directive definition to be added to the
  // schema preamble
  preamble: string;
  name: string;
  validate: (path: SchemaNode[]) => void;
  generate: (path: SchemaNode[], model: WarthogModel) => WarthogModel;
}
