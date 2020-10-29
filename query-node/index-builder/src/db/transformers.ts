import * as BN from 'bn.js';
import { ValueTransformer } from 'typeorm';

export class NumericTransformer implements ValueTransformer {
  /**
   * Used to marshal data when writing to the database.
   */
  to(value: BN): string {
    return value ? value.toString() : value;
  }
  /**
   * Used to unmarshal data when reading from the database.
   */
  from(value: string): BN {
    return new BN(value);
  }
}
