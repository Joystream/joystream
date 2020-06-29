import { GraphQLSchemaParser, SchemaNode, Visitor } from './../../src/parse/SchemaParser';
import { expect } from 'chai';
import { FULL_TEXT_SEARCHABLE_DIRECTIVE } from '../../src/parse/SchemaDirective';

describe('SchemaParser', () => {
    it('should fail on non-existent file', () => {
            expect(() => new GraphQLSchemaParser('./non-existent')).to.throw('not found');
    });
    
    it('should find a top-level entity', () => {
       const schema = GraphQLSchemaParser.buildSchema(`
            type Cat {
                meow: String!
            }
       `); 
       expect(GraphQLSchemaParser.createObjectTypeDefinations(schema)).length(1, 
            "Should detect exactly one type");
    });

    it('should throw an error on invalid schema', () => {
        const schema = `
            _type Cat {
                meow: String!
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('Syntax Error');
    });

    it('should throw on unknown directive', () => {
        const schema = `
            type Cat {
                meow: String! @undeclared
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('Unknown directive');
    });

    it('should throw on wrong location', () => {
        const schema = `
            type Cat @${FULL_TEXT_SEARCHABLE_DIRECTIVE} {
                meow: String! 
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('may not be used on OBJECT');
    });

    it('should throw on wrong argument', () => {
        const schema = `
            type Cat {
                meow: String! @${FULL_TEXT_SEARCHABLE_DIRECTIVE}(qquery: "dfd")
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('"String!" is required');
    });

    it('should detect fields types and directives', () => {
        const schema = `
            type Cat {
                meow: String! @${FULL_TEXT_SEARCHABLE_DIRECTIVE}(query: "dfd")
            }`; 
       const gSchema = GraphQLSchemaParser.buildSchema(schema);
       const typeNodes = GraphQLSchemaParser.createObjectTypeDefinations(gSchema)
       expect(typeNodes).length(1);
       const node = typeNodes[0];
       expect(node?.fields?.[0]?.directives?.[0]?.name?.value).eq(`${FULL_TEXT_SEARCHABLE_DIRECTIVE}`, 'Should find a directive');
    });

    // TODO: this test now failes because apparently __ prefixed types do not pass validation
    //
    // it('should detect fields types and directives', () => {
    //     const schema = `
    //         type __Skip {
    //             a: String! 
    //         }`; 
    //    const gSchema = GraphQLSchemaParser.buildSchema(schema);
    //    const typeNodes = GraphQLSchemaParser.createObjectTypeDefinations(gSchema)
    //    expect(typeNodes).length(0,'Should ignore __ prefixed types');    
    // })

    it('should load file', () => {
        const parser = new GraphQLSchemaParser('test/fixtures/single-type.graphql');
        expect(parser.getTypeNames()).length(1, "Should detect one type");
        expect(parser.getFields(parser.getObjectDefinations()[0])).length(5, "Should detect fields");
    });

    it('should visit directives', () => {
        const parser = new GraphQLSchemaParser('test/fixtures/single-type.graphql');
        const names: string[] = [];
        const visitor: Visitor = {
            visit: (path) => {
                path.map((n: SchemaNode) => names.push(n.name.value));
            }
        }    
        const directives: { [key:string]: Visitor } = {};
        directives[`${FULL_TEXT_SEARCHABLE_DIRECTIVE}`] = visitor;
        parser.dfsTraversal({
            directives
        });

        expect(names).members(["Membership", "handle", `${FULL_TEXT_SEARCHABLE_DIRECTIVE}`], "Should detect full path");
    });

    // TODO: in order to allow multiple directives we need to switch off SDL validation
    // in the parser. So this test is comment for the future use
    //
    // it('should support multiple directives', () => {
    //     const parser = new GraphQLSchemaParser('test/fixtures/multiple-queries.graphql');
    //     const queries: string[] = [];
    //     const visitor: Visitor = {
    //         visit: (path) => {
    //             path.map((n: SchemaNode) => {
    //                 if (n.kind === 'Directive') {
    //                     queries.push((n.arguments?.[0].value as StringValueNode).value)    
    //                 }
                    
    //             });
    //         }
    //     }    
    //     parser.dfsTraversal({
    //         directives: {
    //             "fullTextSearchable": visitor
    //         }
    //     });

    //     expect(queries).members(["handles1", "handles2"], "Should detect multiple queries on the same field");
    // })

});