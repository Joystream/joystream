// Conversion of Joystream types into @polkadot/typegen compatible RegistryTypes json file

import { types } from '../index'
import { Constructor, Codec, RegistryTypes, Registry } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types'
import fs from 'fs'
import path from 'path'

const OUTPUT_PATH = path.join(__dirname, '../../augment/all/defs.json')

function normalizeDef(registry: Registry, defOrConstructor: any, typeName: string): RegistryTypes[string] {
  if (typeof defOrConstructor === 'string') {
    // Replace unhandled BTreeSet with Vec
    // FIXME: Remove after updating @polkadot/api!
    defOrConstructor = defOrConstructor.replace('BTreeSet<', 'Vec<')
    // Workaround for "Unhandled type VecFixed"
    defOrConstructor = defOrConstructor.replace('[u8;32]', 'Hash')
    return defOrConstructor
  } else if (typeof defOrConstructor === 'function') {
    const defString = new (defOrConstructor as Constructor<Codec>)(registry).toRawType().toString()
    let obj: any

    try {
      obj = JSON.parse(defString)
    } catch (e) {
      // def if just a type name:
      return defString
    }

    // def is an object:
    const normalizedObj: any = {}
    if (obj._enum && Array.isArray(obj._enum)) {
      // Enum as array - No need to normalize
      return obj
    } else if (obj._enum && !Array.isArray(obj._enum)) {
      // Enum as object - normalize properties
      normalizedObj._enum = {}
      Object.entries(obj._enum).forEach(([key, value]) => {
        const normalizedValue = normalizeDef(registry, value, `${typeName}[${key}]`)
        if (typeof normalizedValue !== 'string') {
          throw new Error(
            `Too many nested definitions in ${typeName} enum. Did you forget to expose some types in the registry?`
          )
        }
        normalizedObj._enum[key] = normalizedValue
      })
    } else if (obj._set) {
      // Set - we don't need those now, but perhaps worth looking into at some point
      throw new Error('_set definitions are not supported yet!')
    } else {
      // Struct - normalize properties
      for (const [key, value] of Object.entries(obj)) {
        // Prevent interface clashes
        const normalizedValue = normalizeDef(registry, value, `${typeName}[${key}]`)
        if (typeof normalizedValue !== 'string') {
          throw new Error(
            `Too many nested definitions in ${typeName} struct. Did you forget to expose some types in the registry?`
          )
        }
        normalizedObj[key] = normalizedValue
      }
    }

    return normalizedObj
  }

  throw new Error(`Unkown type entry for ${typeName} found in registry!`)
}

function defsFromTypes(types: RegistryTypes) {
  const registry = new TypeRegistry()
  registry.setKnownTypes({ types })
  registry.register(types)
  const defs: RegistryTypes = {}
  Object.entries(registry.knownTypes.types as any).forEach(([typeName, defOrConstructor]) => {
    const def = normalizeDef(registry, defOrConstructor, typeName)
    defs[typeName] = def
  })

  return defs
}

const defs = defsFromTypes(types)
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(defs, undefined, 4))
