import { Null, BTreeSet } from '@polkadot/types'
import PropertyOfClass from './PropertyOfClass'
import { JoyEnum } from '../../common'

export class NoReferencingAllowed extends Null {}
export class NoConstraint extends Null {}
export class Restricted extends BTreeSet.with(PropertyOfClass) {}

export const ReferenceConstraintDef = {
  NoReferencingAllowed,
  NoConstraint,
  Restricted,
} as const

export class ReferenceConstraint extends JoyEnum(ReferenceConstraintDef) {}
