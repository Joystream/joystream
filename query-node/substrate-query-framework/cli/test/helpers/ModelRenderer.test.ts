import { ModelRenderer } from "../../src/generate/ModelRenderer";
import { WarthogModel, Field, ObjectType } from '../../src/model';
import { createModel } from './model';
import * as fs from 'fs-extra';
import { expect } from 'chai';
import Debug from "debug";

const debug = Debug('cli-test:model-renderer');

describe('ModelRenderer', () => {
  let generator: ModelRenderer;
  let warthogModel: WarthogModel;
  let modelTemplate: string;

  before(() => {
    // set timestamp in the context to make the output predictable
    generator = new ModelRenderer();
    modelTemplate = fs.readFileSync('./src/templates/entities/model.ts.mst', 'utf-8');

  })

  beforeEach(() => {
    warthogModel = createModel();
  })

  it('should transform fields to camelCase', function () {

    warthogModel.addField("Post", new Field("CamelCase", "String"));
    warthogModel.addField("Post", new Field("snake_case", "String"));
    warthogModel.addField("Post", new Field("kebab-case", "String"));

    const rendered = generator.generate(modelTemplate, warthogModel.lookupType("Post"));

    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include('camelCase?: string', 'Should camelCase correctly');
    expect(rendered).to.include('snakeCase?: string', 'Should camelCase correctly');
    expect(rendered).to.include('kebabCase?: string', 'Should camelCase correctly');

  })

  it('should render ClassName', function () {
    warthogModel.addObjectType({
      name: `some_randomEntity`,
      isEntity: true,
      fields: [new Field("a", "String")]
    } as ObjectType);

    const rendered = generator.generate(modelTemplate, warthogModel.lookupType("some_randomEntity"));
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include('export class SomeRandomEntity extends BaseModel', 'Should render ClassName corretly');

  })

  it('should include imports', function () {

    warthogModel.addField("Post", new Field("a", 'ID'));
    warthogModel.addField("Post", new Field("b", 'String'));
    warthogModel.addField("Post", new Field("c", 'Int'));
    warthogModel.addField("Post", new Field("d", "Date"));
    warthogModel.addField("Post", new Field("e", "Float"));
    warthogModel.addField("Post", new Field("f", "BigInt"));
    warthogModel.addField("Post", new Field("g", "BigDecimal"));
    warthogModel.addField("Post", new Field("h", "Bytes"));
    warthogModel.addField("Post", new Field("j", "Boolean"));

    const rendered = generator.generate(modelTemplate, warthogModel.lookupType("Post"));

    expect(rendered).to.include('BooleanField,', 'Should import BooleanField');
    expect(rendered).to.include('DateField,', 'Should import DateField');
    expect(rendered).to.include('FloatField,', 'Should import FloatField');
    expect(rendered).to.include('IntField,', 'Should import IntField');
    expect(rendered).to.include('NumericField,', 'Should import NumericField');
    expect(rendered).to.include('BytesField,', 'Should import BytesField');


  })
})