import { SchemaNode } from './SchemaParser';
import { WarthogModel, ObjectType, Field } from '../model';
import { DirectiveNode, TypeNode, ArgumentNode, StringValueNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { cloneDeep } from 'lodash';

export const FULL_TEXT_SEARCHABLE_DIRECTIVE = 'fulltext';

export interface DirectiveVisitor {
    // directive name to watch
    directiveName: string,
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
    preamble: string,
    name: string,
    validate: (path: SchemaNode[]) => void; 
    generate: (path: SchemaNode[], model: WarthogModel) => WarthogModel,
}

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
        const field: Field  = model.lookupField(objTypeNode.name.value, fieldNode.name.value);
        const objType: ObjectType = model.lookupType(objTypeNode.name.value);

        model.addQueryClause(qName, field, objType);

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

export const DIRECTIVES: SchemaDirective[] = [new FTSDirective()];
