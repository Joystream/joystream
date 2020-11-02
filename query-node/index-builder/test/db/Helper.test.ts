import { expect } from 'chai';
import { DeepPartial } from 'typeorm';

import { fillRequiredWarthogFields } from '../../src/db/helper';

describe('IndexBuilder::DatabaseHelper', () => {
  it('should fill warthog required fields', () => {
    class Member {
      id!: string;
      createdById!: string;
      version!: number;
      constructor(init?: Partial<Member>) {
        Object.assign(this, init);
      }
    }

    let m: DeepPartial<Member> = new Member();
    m = fillRequiredWarthogFields(m);

    expect(m).to.haveOwnPropertyDescriptor('id', 'should have id field with value');
    expect(m).to.haveOwnPropertyDescriptor('createdById', 'should have id field with value');
    expect(m).to.haveOwnPropertyDescriptor('version', 'should have id field with value');

    const { 0: id, 1: version } = ['asd123', 12345];
    let m2: DeepPartial<Member> = new Member({ id, version });
    m2 = fillRequiredWarthogFields(m2);

    expect(m2.id).to.equal(id, `should have value: ${id}`);
    expect(m2.version).to.equal(version, `should have value: ${version}`);
  });
});
