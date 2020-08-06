import { createModel, threadObjType, postObjType, fromStringSchema } from './model';
import { expect } from 'chai';
import { WarthogModel } from '../../src/model';
import { ModelType } from '../../src/model/WarthogModel';

describe('WarthogModel', () => {
  let warthogModel: WarthogModel;

  beforeEach(() => {
    warthogModel = createModel();
  });

  it('Should lookup entities', () => {
    expect(warthogModel.lookupEntity('Thread')).eq(threadObjType, 'Should find Thread type');
    expect(warthogModel.lookupEntity('Post')).eq(postObjType, 'Should find Post type');

    expect(() => warthogModel.lookupEntity('NoSuchType')).throw('NoSuchType is undefined');
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
    expect(model.lookupEntity('A').interfaces).length(1, 'Should register the implemented interface');
  });

  it('Should lookup types', () => {
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
    }
    
    enum MyEnum {
      A
    }

    interface MyInterface @entity {
      xxx: String!
    }
    `);
    expect(model.lookupType('MyEntity')).eq(ModelType.ENTITY, 'Should detect entities');
    expect(model.lookupType('HappyPoor')).eq(ModelType.VARIANT, 'Should detect variants');
    expect(model.lookupType('MyEnum')).eq(ModelType.ENUM, 'Should detect enums');
    expect(model.lookupType('MyInterface')).eq(ModelType.INTERFACE, 'Should detect intefaces');
    expect(model.lookupType('Poor')).eq(ModelType.UNION, 'Should detect unions');
    expect(model.lookupType('String')).eq(ModelType.SCALAR, 'Should detect String as a scalar');
    expect(model.lookupType('Boolean')).eq(ModelType.SCALAR, 'Should detect Boolean as a scalar');
    expect(model.lookupType('BigInt')).eq(ModelType.SCALAR, 'Should detect BigInt as a scalar');
    expect(model.lookupType('Bytes')).eq(ModelType.SCALAR, 'Should detect Bytes as a scalar');
  });

  it('Should add variants and unions', () => {
    const model = fromStringSchema(`
    union Poor = HappyPoor | Miserable
    type HappyPoor @variant {
      father: Poor!
      mother: Poor!
    }
    
    type Miserable @variant {
      hates: String!
    }`);
    expect(model.lookupUnion('Poor').name).eq('Poor', 'Should look up a union');
    expect(model.lookupUnion('Poor').types).length(2, 'Should find two variant types');
    expect(model.variants).length(2, 'Should find two variant types');
  });

  it('Should throw on non-variant union', () => {
    expect(() =>
      fromStringSchema(`
    union Poor = HappyPoor | Miserable
    type HappyPoor @variant {
      father: Poor!
      mother: Poor!
    }
    
    type Miserable @entity {
      hates: String!
    }`)
    ).throw('Variant Miserable is undefined', 'Unions should allow only @variant types');
  });

  // TODO: Not yet implemented!
  //
  // it('Should throw on variant fields', () => {
  //   expect(() => fromStringSchema(`
  //   union Poor = HappyPoor | Miserable
  //   type HappyPoor @variant {
  //     father: Poor!
  //     mother: Poor!
  //   }

  //   type Miserable @variant {
  //     hates: String!
  //   }

  //   type MyEntity @entity {
  //     status: Miserable!
  //   }

  //   `)).throw('The field MyEntity.status cannot be of variant type', 'Variant types are not allowed in entity fields');
  // })

  it('Should add a union field to an entity', () => {
    const model = fromStringSchema(`
    union Poor = HappyPoor | Miserable
    type HappyPoor @variant {
      father: String!
      mother: String!
    }
    
    type Miserable @variant {
      hates: String!
    }
    
    type MyEntity @entity {
      status: Poor!
    }`);

    expect(model.lookupEntity('MyEntity').fields[0].isUnion(), 'Should have a single field of union type').to.be.true;
  });
});
