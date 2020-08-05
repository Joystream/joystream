// Conversion of Joystream types into @polkadot/typegen compatible RegistryTypes object
// (will require a few additonal tweaks to work, currently just logs the output in the console)

import { types } from '../index'
import { Constructor, Codec, RegistryTypes, Registry } from '@polkadot/types/types'
import { TypeRegistry } from '@polkadot/types'

function normalizeDef(registry: Registry, defOrConstructor: any, typeName: string) {
  if (typeof defOrConstructor === 'string') {
    return defOrConstructor
  } else if (typeof defOrConstructor === 'function') {
    const defString = new (defOrConstructor as Constructor<Codec>)(registry).toRawType().toString()
    try {
      const obj = JSON.parse(defString)
      // def is an object:
      return obj
    } catch (e) {
      // def if just a type name:
      return defString
    }
  }

  throw new Error(`Unkown type entry for ${typeName} found in registry!`)
}

async function defsFromTypes() {
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

defsFromTypes()
  .then((defs) => console.log(defs))
  .catch(console.error)
