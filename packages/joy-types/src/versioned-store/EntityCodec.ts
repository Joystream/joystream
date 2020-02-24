import camelCase from 'lodash/camelCase';
import BN from 'bn.js';
import { Text, bool, Vec, u16 } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import * as PV from './PropertyValue';
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
 * to Substrate equivalent in Versioned Store module.
 * 
 * Based on code of transformPropertyValue from another Joystream repo:
 * /versioned-store-js/src/transformPropertyValue.ts
 */
function plainToSubstrate(propType: string, value: any): PropertyValue {

  const ok = (typeEnum: PV.PropertyValueEnum) => {
    return new PropertyValue({ [propType]: typeEnum })
  }

  const valueAsBool = (): boolean => {
    if (typeof value === 'string' || typeof value === 'number') {
      value = value.toString().toLowerCase()
      if (['true', 'yes', '1'].indexOf(value) >= 0) {
        return true
      }
      return false
    } else if (typeof value === 'boolean') {
      return value
    } else {
      throw new Error('Unsupported representation of a boolean value: ' + value)
    }
  }

  const valueAsBoolArr = (): boolean[] => {
    return (value as []).map(valueAsBool)
  }

  switch (propType) {

    // Primitives:

    case 'None':        return ok(new PV.None())
    case 'Bool':        return ok(new PV.Bool(valueAsBool()))
    case 'Uint16':      return ok(new PV.Uint16(value as string))
    case 'Uint32':      return ok(new PV.Uint32(value as string))
    case 'Uint64':      return ok(new PV.Uint64(value as string))
    case 'Int16':       return ok(new PV.Int16(value as string))
    case 'Int32':       return ok(new PV.Int32(value as string))
    case 'Int64':       return ok(new PV.Int64(value as string))
    case 'Text':        return ok(new PV.Text(value as string))
    case 'Internal':    return ok(new PV.Internal(value as string))

    // Vectors:

    case 'BoolVec':     return ok(new PV.BoolVec(valueAsBoolArr()))
    case 'Uint16Vec':   return ok(new PV.Uint16Vec(value as string[]))
    case 'Uint32Vec':   return ok(new PV.Uint32Vec(value as string[]))
    case 'Uint64Vec':   return ok(new PV.Uint64Vec(value as string[]))
    case 'Int16Vec':    return ok(new PV.Int16Vec(value as string[]))
    case 'Int32Vec':    return ok(new PV.Int32Vec(value as string[]))
    case 'Int64Vec':    return ok(new PV.Int64Vec(value as string[]))
    case 'TextVec':     return ok(new PV.TextVec(value as string[]))
    case 'InternalVec': return ok(new PV.InternalVec(value as string[]))

    default: {
      console.log(`Unknown property type name: ${propType}`)
      return undefined
    }
  }
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
  toSubstrateUpdate (updatedProps: Partial<{ [propName: string]: any }>): VecClassPropertyValue {

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
