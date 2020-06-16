import { SchemaNode } from './SchemaParser';
import { SchemaDirective } from './SchemaDirective';
import { cloneDeep } from 'lodash';
import { WarthogModel } from '../model';
import { DirectiveNode, TypeNode, ArgumentNode, StringValueNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';

export const FULL_TEXT_SEARCHABLE_DIRECTIVE = 'fulltext';

export class FTSDirective implements SchemaDirective {
  preamble = `directive @${FULL_TEXT_SEARCHABLE_DIRECTIVE}(query: String!) on FIELD_DEFINITION`
  name = FULL_TEXT_SEARCHABLE_DIRECTIVE
  
  validate(_path: SchemaNode[]):void {  
      const path = cloneDeep(_path);

      if (path.length < 3) {
          throw new Error("The path should contain at least a type and field definition nodes");
      }
      const dirNode = path.pop();
      if (dirNode?.kind !== 'Directive') {
          throw new Error("The path should end at a directive node");
      }
      const fieldNode = path.pop();
      if (fieldNode?.kind !== 'FieldDefinition') {
          throw new Error("The directive should be applied to a field node");
      }
      let type: TypeNode = fieldNode.type;
      if (fieldNode.type.kind === 'NonNullType') {
          type = fieldNode.type.type;
      } 
      if (type.kind == 'ListType') {
          throw new Error("Only single named types are supported");
      }
      if (type.kind !== 'NamedType') {
          throw new Error("Only single named types are supported");
      }
      if (type.name.value !== 'String') {
          throw new Error(`Only string types can be annotaed ${FULL_TEXT_SEARCHABLE_DIRECTIVE}`);
      } 
  }

  generate(path: SchemaNode[], model: WarthogModel): WarthogModel { 
      this.validate(path);

      const dirNode = path.pop() as DirectiveNode;
      const fieldNode = path.pop() as FieldDefinitionNode;
      const objTypeNode = path.pop() as ObjectTypeDefinitionNode;

      const qName: string  = this._checkFullTextSearchDirective(dirNode);
      model.addQueryClause(qName, fieldNode.name.value, objTypeNode.name.value);

      return model 
  }


 /**
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
}