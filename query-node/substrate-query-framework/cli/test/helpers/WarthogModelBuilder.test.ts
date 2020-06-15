import { WarthogModelBuilder } from './../../src/helpers/WarthogModelBuilder';
import { expect } from 'chai';

describe('WarthogModelBuild', () => {
    it('should add multi-field multi-entity FTSQuery to the model', () => {
        const generator = new WarthogModelBuilder('test/fixtures/multiple-entities.graphql');
        const model = generator.buildWarthogModel()

        expect(model.ftsQueries).length(1, "Should detect a query");
        const query = model.ftsQueries[0];
        expect(query.clauses).length(4, "The query should contain four clauses");
        const entities: string[] = [];
        const fields: string[] = [];
        query.clauses.map((c) =>  {
            entities.push(c.entity.name);
            fields.push(c.field.name);
        })
        expect(entities).to.include.members(["Category", "Thread", "Post"], "Should detect three entities");
        expect(fields).to.include.members(["initial_body_text", "name"], "Should detect fields");
        
    });

    it('should detect multiple queries', () => {
        const generator = new WarthogModelBuilder('test/fixtures/multiple-queries.graphql');
        const model = generator.buildWarthogModel();
        expect(model.ftsQueries).length(2, "Should detect two queries");
    })
});