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

  static NoReferencingAllowed () : ReferenceConstraint {
    return new ReferenceConstraint({'NoReferencingAllowed': new NoReferencingAllowed()});
  }

  static NoConstraint () : ReferenceConstraint {
    return new ReferenceConstraint({'NoConstraint': new NoConstraint()});
  }

  static Restricted (restrictions: Vec<PropertyOfClass>) : ReferenceConstraint {
    return new ReferenceConstraint({'Restricted': new Restricted(restrictions)});
  }
}