import { Field } from '.';

export function validateVariantField(f: Field):void {
  if (f.isRelationType()) {
    throw new Error(`Reference types are not supported in varaints`);
  } 
}

