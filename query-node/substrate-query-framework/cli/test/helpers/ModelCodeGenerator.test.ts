import { GraphQLSchemaParser } from './../../src/helpers/SchemaParser';
import { expect } from 'chai';

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
    })

    it('should throw on unknown directive', () => {
        const schema = `
            type Cat {
                meow: String! @undeclared
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('Unknown directive');
    })

    it('should throw on wrong location', () => {
        const schema = `
            type Cat @fullTextSearchable {
                meow: String! 
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('may not be used on OBJECT');
    })

    it('should throw on wrong argument', () => {
        const schema = `
            type Cat {
                meow: String! @fullTextSearchable(qquery: "dfd")
            }`; 
       expect(() => GraphQLSchemaParser.buildSchema(schema)).to.throw('"String!" is required');
    })

    it('should detect fields types and directives', () => {
        const schema = `
            type Cat {
                meow: String! @fullTextSearchable(query: "dfd")
            }`; 
       const gSchema = GraphQLSchemaParser.buildSchema(schema);
       const typeNodes = GraphQLSchemaParser.createObjectTypeDefinations(gSchema)
       expect(typeNodes).length(1);
       const node = typeNodes[0];
       expect(node?.fields?.[0]?.directives?.[0]?.name?.value).eq('fullTextSearchable', 'Should find a directive');
    })

    it('should detect fields types and directives', () => {
        const schema = `
            type __Skip {
                a: String! 
            }`; 
       const gSchema = GraphQLSchemaParser.buildSchema(schema);
       const typeNodes = GraphQLSchemaParser.createObjectTypeDefinations(gSchema)
       expect(typeNodes).length(0,'Should ignore __ prefixed types');    
    })

    it('should load file', () => {
        const parser = new GraphQLSchemaParser('test/fixtures/single-type.graphql');
        expect(parser.getTypeNames()).length(1, "Should detect one type");
        expect(parser.getFields(parser.getObjectDefinations()[0])).length(5, "Should detect fields");
    })

});