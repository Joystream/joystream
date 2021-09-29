// Conversion of Joystream types into @polkadot/typegen compatible RegistryTypes json file

import { types } from '../index'
import { Constructor, Codec, RegistryTypes, Registry } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

const OUTPUT_PATH = path.join(__dirname, '../../augment/all/defs.json')

function normalizeDef(registry: Registry, defOrConstructor: unknown, typeName: string): RegistryTypes[string] {
  if (typeof defOrConstructor === 'string') {
    let typeName: string = defOrConstructor
    // Replace unhandled BTreeSet with Vec
    // FIXME: Remove after updating @polkadot/api!
    typeName = typeName.replace('BTreeSet<', 'Vec<')
    // Workaround for "Unhandled type VecFixed"
    typeName = typeName.replace('[u8;32]', 'Hash')
    return typeName
  }

  if (typeof defOrConstructor === 'function') {
    const TypeConstructor = defOrConstructor as Constructor<Codec>
    const defString = new TypeConstructor(registry).toRawType().toString()
    let obj: RegistryTypes[string]

    try {
      obj = JSON.parse(defString)
    } catch (e) {
      // def is a string (type name)
      return defString
    }

    // String (type name) - no need to normalize
    if (typeof obj === 'string') {
      return obj
    }

    // Enum as array - no need to normalize
    if (typeof obj === 'object' && '_enum' in obj && Array.isArray(obj._enum)) {
      return obj
    }

    // Enum as object - normalize properties
    if (typeof obj === 'object' && '_enum' in obj && typeof obj._enum === 'object' && !Array.isArray(obj._enum)) {
      const normalizedEnumDef = _.mapValues(obj._enum, (value, key) => {
        const normalizedValue = normalizeDef(registry, value, `${typeName}[${key}]`)
        if (typeof normalizedValue !== 'string') {
          throw new Error(
            `Too many nested definitions in ${typeName} enum. Did you forget to expose some types in the registry?`
          )
        }
        return normalizedValue
      }) as Record<string, string>
      return { _enum: normalizedEnumDef }
    }

    // Set - not supported now
    if ('_set' in obj) {
      throw new Error('_set definitions are not supported yet!')
    }

    // Struct - normalize properties
    if (typeof obj === 'object' && !('_enum' in obj) && !('_set' in obj)) {
      return _.mapValues(obj, (value, key) => {
        const normalizedValue = normalizeDef(registry, value, `${typeName}[${key}]`)
        if (typeof normalizedValue !== 'string') {
          throw new Error(
            `Too many nested definitions in ${typeName} struct. Did you forget to expose some types in the registry?`
          )
        }
        return normalizedValue
      })
    }
  }

  throw new Error(`Unkown type entry for ${typeName} found in registry!`)
}

function defsFromTypes(types: RegistryTypes) {
  const registry = new TypeRegistry()
  registry.setKnownTypes({ types })
  registry.register(types)
  const defs: RegistryTypes = {}
  Object.entries(registry.knownTypes.types as Omit<RegistryTypes, string>).forEach(([typeName, defOrConstructor]) => {
    const def = normalizeDef(registry, defOrConstructor, typeName)
    defs[typeName] = def
  })

  return defs
}

const defs = defsFromTypes(types)
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(defs, undefined, 4))
