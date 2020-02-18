import camelCase from 'lodash/camelCase';
import BN from 'bn.js';
import { Text, bool, Vec, u16 } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { PropertyValue } from './PropertyValue';
import { Class, Entity, VecClassPropertyValue, ClassPropertyValue } from '.';
import PropertyTypeName from './PropertyTypeName';

/**
 * Convert a Substrate value to a plain JavaScript value of a corresponding type
 * like string, number, boolean, etc.
 */
function substrateToPlain<T> (x: Codec): T | undefined {
  let res: any = undefined;

  if (x instanceof Text) {
    res = (x as Text).toString();
  } else if (x instanceof BN) {
    res = (x as BN).toNumber();
  } else if (x instanceof bool) {
    res = (x as bool).valueOf();
  } else if (x instanceof Vec) {
    res = x.map(y => substrateToPlain(y));
  } else if (typeof x !== undefined && x !== null) {
    res = x.toString();
  }

  return res;
}

/**
 * Convert a plain JavaScript value of such type as string, number, boolean 
 * to Substrate equivalent.
 * 
 * Based on code of transformPropertyValue from another Joystream repo:
 * /versioned-store-js/src/transformPropertyValue.ts
 */
export function plainToSubstrate(propType: PropertyTypeName, value?: any): PropertyValue {
  return new PropertyValue({ [propType]: value });
}

function propNameToJsFieldStyle (humanFriendlyPropName: string): string {
  return camelCase(humanFriendlyPropName);
}

type PropMeta = {
  index: number
  type: string
}

export type PlainEntity = {
  id: number
  [propName: string]: any
}

export type TextValueEntity = PlainEntity & {
  value: string
}

export abstract class EntityCodec<T extends PlainEntity> {
  
  private propNameToMetaMap: Map<string, PropMeta> = new Map();
  private propIndexToNameMap: Map<number, string> = new Map();
  
  public constructor (entityClass: Class) {
    entityClass.properties.map((p, index) => {
      const propName = propNameToJsFieldStyle(p.name.toString());
      const propMeta = { index, type: p.prop_type.toString() };
      this.propNameToMetaMap.set(propName, propMeta);
      this.propIndexToNameMap.set(index, propName);
    })
  }

  /**
   * Converts an entity of Substrate codec type to a plain JS object.
   */
  toPlainObject (entity: Entity): T | undefined {
    const res: PlainEntity = { id: entity.id.toNumber() };
    entity.entity_values.forEach(v => {
      const propIdx = v.in_class_index.toNumber();
      const propName = this.propIndexToNameMap.get(propIdx);
      if (propName) {
        res[propName] = substrateToPlain(v.value.value);
      }
    });
    return res as T;
  }
  
  toPlainObjects (entities: Entity[]): T[] {
    return entities
      .map((e) => this.toPlainObject(e))
      .filter((e) => typeof e !== undefined) as T[]
  }

  /**
   * Converts an object with updated property values to a Substrate vector
   * that can be passed to the extrinsic `update_entity_property_values`
   * of Substrate runtime module `substrate-versioned-store`.
   */
  toSubstrateUpdate (updatedProps: Partial<T>): VecClassPropertyValue {

    // TODO check required fields! save prop metadata in constructor?

    const res = new VecClassPropertyValue();
    Object.keys(updatedProps).map(propName => {
      const meta = this.propNameToMetaMap.get(propName);
      if (meta) {
        const propType = meta.type as PropertyTypeName;
        const propValue = (updatedProps as any)[propName];
        res.push(new ClassPropertyValue({
          in_class_index: new u16(meta.index),
          value: plainToSubstrate(propType, propValue)
        }));
      }
    });
    return res;
  }
}

/** This class is created just to satisfy TypeScript in some cases */
export class AnyEntityCodec extends EntityCodec<any> {}
