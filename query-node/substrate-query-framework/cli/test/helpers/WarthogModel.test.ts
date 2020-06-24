import { createModel, threadObjType, postObjType, fromStringSchema } from './model';
import { expect } from 'chai';
import { WarthogModel } from '../../src/model';

describe('WarthogModel', () => {
  let warthogModel: WarthogModel;

  beforeEach(() => {
    warthogModel = createModel();
  });

  it('Should lookup types', () => {
    expect(warthogModel.lookupType('Thread')).eq(threadObjType, 'Should find Thread type');
    expect(warthogModel.lookupType('Post')).eq(postObjType, 'Should find Post type');

    expect(() => warthogModel.lookupType('NoSuchType')).throw('No ObjectType');
  });

  it('Should lookup fields', () => {
    const field = warthogModel.lookupField('Thread', 'initial_body_text');
    expect(field.type).equals('String', 'Should lookup the field');

    expect(() => warthogModel.lookupField('Thread', 'noexistent')).throw('No field');
  });

  it('Should add queries', () => {
    warthogModel.addQueryClause('test', 'initial_body_text', 'Thread');
    warthogModel.addQueryClause('test', 'initial_body_text', 'Post');
    expect(warthogModel.ftsQueries).length(1, 'Should add a query');
    expect(warthogModel.ftsQueries[0].clauses).length(2, 'Should add two clauses');
  });

  it('Should add enums', () => {
    const model = fromStringSchema(`
        enum Episode {
            NEWHOPE
            EMPIRE
            JEDI
        }
        
        type Movie @entity {
            episode: Episode
        }`);
    expect(model.enums).length(1, 'Should add an enum');
    expect(model.lookupEnum('Episode').name).eq('Episode', 'Should lookup by name');
  });

  it('Should add interfaces', () => {
    const model = fromStringSchema(`
        interface IEntity @entity {
            f: String
        }`);
    expect(model.interfaces).length(1, 'Should add an interface');
    expect(model.lookupInterface('IEntity').name).eq('IEntity', 'Should lookup by name');
    expect(model.lookupInterface('IEntity').isInterface).eq(true, 'Should be an interface');
    
  });

  it('Should should ignore interfaces without @entity', () => {
    const model = fromStringSchema(`
        interface IEntity {
            f: String
        }`);
    expect(model.interfaces).length(0, 'Should skip the non-annotated interface');
  });

  it('Should add interfaces to entities', () => {
    const model = fromStringSchema(`
        interface IEntity @entity {
            field1: String
        }
        type A implements IEntity @entity {
            field1: String
            field2: String
        }`);
    expect(model.lookupType('A').interfaces).length(1, 'Should register the implemented interface');
  });
});
