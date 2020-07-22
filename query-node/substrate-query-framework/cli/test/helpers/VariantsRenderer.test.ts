import { fromStringSchema } from './model';
import { expect } from 'chai';
import { VariantsRenderer } from '../../src/generate/VariantsRenderer';
import * as fs from 'fs-extra';

describe('VariantsRenderer', () => {
  let variantsTemplate: string;

  before(() => {
    // set timestamp in the context to make the output predictable
    variantsTemplate = fs.readFileSync('./src/templates/variants/variants.mst', 'utf-8');
  });

  it('Should render union types', () => {
    const model = fromStringSchema(`
    union Poor = HappyPoor | Miserable
    type HappyPoor @variant {
      father: Poor!
      mother: Poor!
    }
    
    type Miserable @variant {
      hates: String!
    }
    
    type MyEntity @entity {
      status: Poor!
    }`);

    const gen = new VariantsRenderer(model);
    const rendered = gen.render(variantsTemplate);

    expect(rendered).include('export const Poor = createUnionType', 'Should create a union type');
    expect(rendered).include('types: () => [HappyPoor, Miserable]', 'Should join types');
    expect(rendered).include('mother!: typeof Poor', 'Should define field');
  });

  it('Should import enums', () => {
    const model = fromStringSchema(`
    enum GeN_ERa_TION {
      BOOMER, ZOOMER, GENEXER
    }
    
    union Status = MiddleClass | Rich 
    
    type Rich @variant {
      bank: String!
    }
    
    type MiddleClass @variant {
      generation: GeN_ERa_TION
    }`);

    const gen = new VariantsRenderer(model);
    const rendered = gen.render(variantsTemplate);

    expect(rendered).include(`import { GeN_ERa_TION } from '../enums/enums'`, 'Should import enums');
  });
});
