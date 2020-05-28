import { GraphQLSchemaParser } from './../../src/helpers/SchemaParser';
import { expect } from 'chai';

describe('SchemaParser', () => {
    it('should fail on non-existent file', () => {
            expect(() => new GraphQLSchemaParser('./non-existent')).to.throw('not found');
    });
    
    it('should find a top-level entity', () => {
       let schema = GraphQLSchemaParser.buildSchema(`
            type Cat {
                meow: String!
            }
       `); 
       expect(GraphQLSchemaParser.createObjectTypeDefinations(schema)).length(1, 
            "Should detect exactly one type");
    });

    
    it('should find a top-level entity', () => {
        let schema = GraphQLSchemaParser.buildSchema(`
             type Cat {
                 meow: String!
             }
        `); 
        expect(GraphQLSchemaParser.createObjectTypeDefinations(schema)).length(1, 
             "Should detect exactly one type");
     });
});