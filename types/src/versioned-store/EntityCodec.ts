import BN from 'bn.js';
import { Text, bool, Vec, u16 } from '@polkadot/types';
import { Codec } from '@polkadot/types/types';
import { Class, Entity, VecClassPropertyValue, ClassPropertyValue, EntityId, ClassId, unifyPropName } from '.';
import * as PV from './PropertyValue';
import { PropertyValue } from './PropertyValue';
import PropertyTypeName from './PropertyTypeName';
import ChannelId from '../content-working-group/ChannelId';

/**
 * Convert a Substrate value to a plain JavaScript value of a corresponding type
 * like string, number, boolean, etc.
 */
function substrateToPlain<T> (x: Codec): T | undefined {
  let res: any = undefined;

  if (x instanceof PV.None) {
    res = undefined;
  } else if (x instanceof Text) {
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
 *
 * @throws Error
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

  const valueAsArr = (): any[] => {
    if (Array.isArray(value)) {
      return value as any[]
    }

    return typeof value === undefined ? [] : [ value ]
  }

  const valueAsBoolArr = (): boolean[] => {
    return valueAsArr().map(valueAsBool)
  }

  const valueAsStrArr = (): string[] => {
    return valueAsArr() as string[]
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
    case 'Uint16Vec':   return ok(new PV.Uint16Vec(valueAsStrArr()))
    case 'Uint32Vec':   return ok(new PV.Uint32Vec(valueAsStrArr()))
    case 'Uint64Vec':   return ok(new PV.Uint64Vec(valueAsStrArr()))
    case 'Int16Vec':    return ok(new PV.Int16Vec(valueAsStrArr()))
    case 'Int32Vec':    return ok(new PV.Int32Vec(valueAsStrArr()))
    case 'Int64Vec':    return ok(new PV.Int64Vec(valueAsStrArr()))
    case 'TextVec':     return ok(new PV.TextVec(valueAsStrArr()))
    case 'InternalVec': return ok(new PV.InternalVec(valueAsArr()))

    default: {
      throw new Error(`Unknown property type name: ${propType}`)
    }
  }
}

interface HasTypeField {
  type: string
}

export function isInternalProp (field: HasTypeField): boolean {
  return field.type === 'Internal'
}

export function isInternalVecProp (field: HasTypeField): boolean {
  return field.type === 'InternalVec'
}

type PropMeta = {
  index: number
  type: string
}

export type PlainEntity = {
  // Fields common for every entity class:
  classId: number
  inClassSchemaIndexes: number[]
  id: number

  // Unique fields per entity class:
  [propName: string]: any
}

export type TextValueEntity = PlainEntity & {
  value: string
}

export class EntityCodecResolver {

  private codecByClassIdMap = new Map<string, AnyEntityCodec>()

  constructor (classes: Class[]) {
    classes.forEach(c => {
      this.codecByClassIdMap.set(c.id.toString(), new AnyEntityCodec(c))
    })
  }

  getCodecByClassId<C extends EntityCodec<any>>(classId: ClassId): C | undefined {
    return this.codecByClassIdMap.get(classId.toString()) as C
  }
}

// TODO delete this hack once EntityCodec extracted from types to media app
type EntityType = any
type ChannelEntity = any

export interface ToPlainObjectProps {
  loadInternals?: boolean
  loadEntityById?: (id: EntityId) => Promise<EntityType | undefined>
  loadChannelById?: (id: ChannelId) => Promise<ChannelEntity | undefined>
}

export abstract class EntityCodec<T extends PlainEntity> {

  private propNameToMetaMap: Map<string, PropMeta> = new Map()
  private propIndexToNameMap: Map<number, string> = new Map()

  public constructor (entityClass: Class) {
    entityClass.properties.map((p, index) => {
      const propName = unifyPropName(p.name.toString());
      const propMeta = { index, type: p.prop_type.type.toString() };
      this.propNameToMetaMap.set(propName, propMeta);
      this.propIndexToNameMap.set(index, propName);
    })
  }

  inClassIndexOfProp (propName: string): number | undefined {
    return this.propNameToMetaMap.get(propName)?.index
  }

  /**
   * Converts an entity of Substrate codec type to a plain JS object.
   */
  async toPlainObject (entity: Entity, props: ToPlainObjectProps = {}): Promise<T | undefined> {

    const {
      loadInternals,
      loadEntityById,
      loadChannelById
    } = props || {}

    const res: PlainEntity = {
      classId: entity.class_id.toNumber(),
      inClassSchemaIndexes: entity.in_class_schema_indexes.map(x => x.toNumber()),
      id: entity.id.toNumber()
    }

    if (!entity.in_class_schema_indexes.toArray().length) {
		throw new Error(`No schema support exists for entity! Entity id: ${res.id}`);
	}

    for (const v of entity.entity_values) {
      const propIdx = v.in_class_index.toNumber();
      const propName = this.propIndexToNameMap.get(propIdx);

      if (propName) {
        const propValue = v.value.value
        let convertedValue: any

        // Load a referred internal entity:
        if (loadInternals) {
          if (
            propValue instanceof PV.Internal &&
            typeof loadEntityById === 'function'
          ) {
            convertedValue = await loadEntityById(propValue as EntityId)
          } else if (
            propName === 'channelId' &&
            typeof loadChannelById === 'function'
          ) {
            res.channel = await loadChannelById(propValue as ChannelId)
          }
        }

        // Just convert a Substrate codec value to JS plain object:
        if (!convertedValue) {
          convertedValue = substrateToPlain(propValue)
        }

        res[propName] = convertedValue
      }
    }

    return res as T
  }

  /**
   * Converts an object with updated property values to a Substrate vector
   * that can be passed to the extrinsic `update_entity_property_values`
   * of Substrate runtime module `substrate-versioned-store`.
   */
  toSubstrateUpdate (updatedProps: Partial<{ [propName: string]: any }>): VecClassPropertyValue {

    // TODO check required fields! save prop metadata in constructor?

    // console.log('propNameToMetaMap propNameToMetaMap', this.propNameToMetaMap)
    // console.log('toSubstrateUpdate updatedProps', updatedProps)

    const res = new VecClassPropertyValue();
    Object.keys(updatedProps).map(propName => {
      const meta = this.propNameToMetaMap.get(propName);
      if (meta) {
        const propType = meta.type as PropertyTypeName;
        const plainValue = (updatedProps as any)[propName];

        let codecValue: PropertyValue | undefined
        try {
          codecValue = plainToSubstrate(propType, plainValue)
        } catch (err) {
          console.error(`Failed to convert plain value '${plainValue}' to Substrate codec. Error:`, err)
        }

        if (codecValue) {
          res.push(new ClassPropertyValue({
            in_class_index: new u16(meta.index),
            value: codecValue
          }))
        }
      }
    });
    return res;
  }
}

/** This class is created just to satisfy TypeScript in some cases */
export class AnyEntityCodec extends EntityCodec<any> {}
