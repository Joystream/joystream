import { Enum, Null, Vec } from '@polkadot/types';
import PropertyOfClass from './PropertyOfClass';

export class NoReferencingAllowed extends Null {}
export class NoConstraint extends Null {}
export class Restricted extends Vec.with(PropertyOfClass) {} // BtreeSet ?

export type ReferenceConstraintVariant =
  NoReferencingAllowed |
  NoConstraint |
  Restricted
;

export type ReferenceConstraintValue = {
    [typeName: string]: ReferenceConstraintVariant;
};

export class ReferenceConstraint extends Enum {
  constructor (value?: ReferenceConstraintValue, index?: number) {
    super({
      NoReferencingAllowed,
      NoConstraint,
      Restricted,
    }, value, index);
  }
}