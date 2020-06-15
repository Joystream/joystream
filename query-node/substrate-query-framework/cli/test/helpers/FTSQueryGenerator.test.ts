/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createModel } from './model';
import * as fs from 'fs-extra';
import { FTSQueryGenerator } from '../../src/generate/FTSQueryRenderer';
import * as chai from 'chai';

const chaiSnapshot = require('mocha-chai-snapshot');
const { expect } = chai;
chai.use(chaiSnapshot);


describe('FTSQueryGenerator', () => {
    let generator: FTSQueryGenerator;

    before(() => {
        // set timestamp in the context to make the output predictable
        generator = new FTSQueryGenerator({"ts": 111111111});
    })

    it('Should generate migration', function() {
        const warthogModel = createModel();

        warthogModel.addQueryClause("test1", "initial_body_text", "Post");
        warthogModel.addQueryClause("test1", "title", "Post");
        warthogModel.addQueryClause("test1", "initial_body_text", "Thread");
        warthogModel.addQueryClause("test1", "title", "Thread");
        
        const templateData = fs.readFileSync('./src/templates/textsearch/migration.ts.mst', 'utf-8');
        
        const transformed = generator.generate(templateData, warthogModel.lookupQuery("test1"));

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (expect(transformed).to as any).matchSnapshot(this);
        
    })
})