import { ModelRenderer } from '../../src/generate/ModelRenderer';
import { WarthogModel, Field, ObjectType } from '../../src/model';
import { createModel, fromStringSchema } from './model';
import * as fs from 'fs-extra';
import { expect } from 'chai';
import Debug from 'debug';
import { EnumContextProvider } from '../../src/generate/EnumContextProvider';

const debug = Debug('cli-test:model-renderer');

describe('ModelRenderer', () => {
  let generator: ModelRenderer;
  let warthogModel: WarthogModel;
  let modelTemplate: string;
  let enumCtxProvider: EnumContextProvider;

  before(() => {
    // set timestamp in the context to make the output predictable
    modelTemplate = fs.readFileSync('./src/templates/entities/model.ts.mst', 'utf-8');
  });

  beforeEach(() => {
    warthogModel = createModel();
    enumCtxProvider = new EnumContextProvider();
  });

  it('should transform fields to camelCase', function () {
    warthogModel.addField('Post', new Field('CamelCase', 'String'));
    warthogModel.addField('Post', new Field('snake_case', 'String'));
    warthogModel.addField('Post', new Field('kebab-case', 'String'));

    generator = new ModelRenderer(warthogModel, warthogModel.lookupType('Post'), enumCtxProvider);

    const rendered = generator.render(modelTemplate);

    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include('camelCase?: string', 'Should camelCase correctly');
    expect(rendered).to.include('snakeCase?: string', 'Should camelCase correctly');
    expect(rendered).to.include('kebabCase?: string', 'Should camelCase correctly');
  });

  it('should render ClassName', function () {
    warthogModel.addObjectType({
      name: `some_randomEntity`,
      isEntity: true,
      fields: [new Field('a', 'String')],
    } as ObjectType);

    generator = new ModelRenderer(warthogModel, warthogModel.lookupType('some_randomEntity'), enumCtxProvider);

    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include('export class SomeRandomEntity extends BaseModel', 'Should render ClassName corretly');
  });

  it('should include imports', function () {
    warthogModel.addField('Post', new Field('a', 'ID'));
    warthogModel.addField('Post', new Field('b', 'String'));
    warthogModel.addField('Post', new Field('c', 'Int'));
    warthogModel.addField('Post', new Field('d', 'Date'));
    warthogModel.addField('Post', new Field('e', 'Float'));
    warthogModel.addField('Post', new Field('f', 'BigInt'));
    warthogModel.addField('Post', new Field('g', 'BigDecimal'));
    warthogModel.addField('Post', new Field('h', 'Bytes'));
    warthogModel.addField('Post', new Field('j', 'Boolean'));

    generator = new ModelRenderer(warthogModel, warthogModel.lookupType('Post'), enumCtxProvider);

    const rendered = generator.render(modelTemplate);

    expect(rendered).to.include('BooleanField,', 'Should import BooleanField');
    expect(rendered).to.include('DateField,', 'Should import DateField');
    expect(rendered).to.include('FloatField,', 'Should import FloatField');
    expect(rendered).to.include('IntField,', 'Should import IntField');
    expect(rendered).to.include('NumericField,', 'Should import NumericField');
    expect(rendered).to.include('BytesField,', 'Should import BytesField');
  });

  it('should render otm types', function () {
    const model = fromStringSchema(`
    type Author @entity {
      posts: [Post!]
    }
    
    type Post @entity {
      title: String
      author: Author!
    }`);

    generator = new ModelRenderer(model, model.lookupType('Author'), enumCtxProvider);

    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include(`import { Post } from '../post/post.model`, `Should render imports`);
    expect(rendered).to.include(`@OneToMany(() => Post, (post: Post) => post.author)`, 'Should render OTM decorator');
    expect(rendered).to.include(`posts?: Post[];`, 'Should render plural references');
  });

  it('should render mto types', function () {
    const model = fromStringSchema(`
    type Author @entity {
      posts: [Post!]
    }
    
    type Post @entity {
      title: String
      # FIXME: this causes a double field author: Author! 
    }`);

    generator = new ModelRenderer(model, model.lookupType('Post'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include(`import { Author } from '../author/author.model`, `Should render imports`);
    expect(rendered).to.include(
      `@ManyToOne(() => Author, (author: Author) => author.posts, {
    skipGraphQLField: true,
  })`,
      'Should render MTO decorator'
    ); // nullable: true is not includered?
    expect(rendered).to.include(`author!: Author;`, 'Should render required referenced field');
  });

  it('should renderer array types', function () {
    const model = fromStringSchema(`
    type Author @entity {
      posts: [String]
    }`);

    generator = new ModelRenderer(model, model.lookupType('Author'), enumCtxProvider);

    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);
    expect(rendered).to.include('CustomField,', 'Should import CustomField');
    expect(rendered).to.include(`@CustomField`, 'Should decorate arrays with @CustomField');
    expect(rendered).to.include(`db: { type: 'text', array: true, nullable: true }`, 'Should add db option');
    expect(rendered).to.include(`api: { type: 'string', nullable: true }`, 'Should inclued api option');
    expect(rendered).to.include('posts?: string[]', `should add an array field`);
  });

  it('should render enum types', function () {
    const model = fromStringSchema(`
      enum Episode {
        NEWHOPE
        EMPIRE
        JEDI
      }
        
      type Movie @entity {
        episode: Episode
      }`);

    generator = new ModelRenderer(model, model.lookupType('Movie'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include('EnumField,', 'Should import EnumField');
    expect(rendered).to.include('export { Episode }', 'Should export enum');
    // this will be generated in ../enums/enum.ts
    //expect(rendered).to.include(`NEWHOPE = 'NEWHOPE'`, 'Should render enum values');
    expect(rendered).to.include(`@EnumField`, 'Should decorate with @EnumField');
    expect(rendered).to.include(`'Episode', Episode, { nullable: true }`, 'Should add enum decorator options');
    expect(rendered).to.include(`episode?:`, 'Should add nullable');
  });

  it('should decorate field with the right enum type', function () {
    const model = fromStringSchema(`
      enum episode_Camel_Case {
        NEWHOPE
        EMPIRE
        JEDI
      }
        
      type Movie @entity {
        episode: episode_Camel_Case
      }`);

    generator = new ModelRenderer(model, model.lookupType('Movie'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);

    expect(rendered).to.include(`import { episode_Camel_Case } from '../enums/enums'`, 'Should import enum');
    expect(rendered).to.include('export { episode_Camel_Case }', 'Should export enum');
    // this will be generated in ../enums/enum.ts
    //expect(rendered).to.include(`NEWHOPE = 'NEWHOPE'`, 'Should render enum values');
    expect(rendered).to.include(
      `'episode_Camel_Case', episode_Camel_Case, { nullable: true }`,
      'Should add enum decorator options'
    );
    expect(rendered).to.include(`episode?: episode_Camel_Case`, 'Should camelCase type');
  });

  it('should import and export both enums', function () {
    const model = fromStringSchema(`
      enum enum1 {
        NEWHOPE
        EMPIRE
        JEDI
      }

      enum enum2 {
        NEWHOPE
        EMPIRE
        JEDI
      }
        
      type Movie @entity {
        field1: enum1,
        field2: enum2
      }`);
    generator = new ModelRenderer(model, model.lookupType('Movie'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    debug(`rendered: ${JSON.stringify(rendered, null, 2)}`);
    expect(rendered).to.include(`import { enum1 } from '../enums/enums'`, 'Should import enum1');
    expect(rendered).to.include('export { enum1 }', 'Should export enum1');
    expect(rendered).to.include(`import { enum2 } from '../enums/enums'`, 'Should import enum2');
    expect(rendered).to.include('export { enum2 }', 'Should export enum2');
  });

  it('should export enum from a single entity', function () {
    const model = fromStringSchema(`
      enum enum1 {
        NEWHOPE
        EMPIRE
        JEDI
      }
      
      type B @entity {
        field1: enum1,
      }

      type A @entity {
        field1: enum1,
      }`);
    generator = new ModelRenderer(model, model.lookupType('A'), enumCtxProvider);
    let rendered = generator.render(modelTemplate);
    debug(`rendered A: ${JSON.stringify(rendered, null, 2)}`);
    expect(rendered).to.include('export { enum1 }', 'Should export enum1');

    generator = new ModelRenderer(model, model.lookupType('B'), enumCtxProvider);
    rendered = generator.render(modelTemplate);
    debug(`rendered B: ${JSON.stringify(rendered, null, 2)}`);
    expect(rendered).to.not.include('export { enum1 }', 'B should not export enum1');
  });

  it('should extend interface type', function () {
    const model = fromStringSchema(`
        interface IEntity @entity {
            field1: String
        }
        type A implements IEntity @entity {
            field1: String
            field2: String
    }`);
    generator = new ModelRenderer(model, model.lookupType('A'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    expect(rendered).to.include('extends IEntity');
    expect(rendered).to.include(`import { IEntity } from '../i-entity/i-entity.model'`, 'should import interface type');
  });

  it('should not include interface field', function () {
    const model = fromStringSchema(`
        interface IEntity @entity {
            field1: String
        }
        type A implements IEntity @entity {
            field1: String
            field2: String
    }`);
    generator = new ModelRenderer(model, model.lookupType('A'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    expect(rendered).to.not.include('field1');
  });

  it('should render interface', function () {
    const model = fromStringSchema(`
        interface IEntity @entity {
            field1: String
        }
        type A implements IEntity @entity {
            field1: String
            field2: String
    }`);
    generator = new ModelRenderer(model, model.lookupInterface('IEntity'), enumCtxProvider);
    const rendered = generator.render(modelTemplate);
    expect(rendered).to.include('@InterfaceType');
  });
});
