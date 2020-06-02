import { createModel, threadObjType, postObjType } from "./model";
import { expect } from 'chai';
import { WarthogModel } from '../../src/model';

describe('WarthogModel', () => {
    let warthogModel: WarthogModel;

    beforeEach(() => {
        warthogModel = createModel();
    })

    it('Should lookup types', () => {
        expect(warthogModel.lookupType("Thread")).eq(threadObjType, "Should find Thread type");
        expect(warthogModel.lookupType("Post")).eq(postObjType, "Should find Post type");
        
        expect(() => warthogModel.lookupType("NoSuchType")).throw("No ObjectType");

    })

    it('Should lookup fields', () => {
        const field = warthogModel.lookupField("Thread", "initial_body_text")
        expect(field.type).equals("String", "Should lookup the field")

        expect(() => warthogModel.lookupField("Thread", "noexistent")).throw("No field");
    })

    it('Should add queries', () => {
        warthogModel.addQueryClause("test", "initial_body_text", "Thread");
        warthogModel.addQueryClause("test", "initial_body_text", "Post");
        expect(warthogModel.ftsQueries).length(1, "Should add a query");
        expect(warthogModel.ftsQueries[0].clauses).length(2, "Should add two clauses");
    })
})