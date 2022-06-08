import { Struct, TypeRegistry } from '@polkadot/types'
import { RegistryTypes } from '@polkadot/types/types'
import defs from'./defs.json'

const emptyStruct = new Struct(new TypeRegistry(), {})

// Prevents errors in interfaces that will be generated based on those types
// ie. an interface cannot have fields like "values" and extend Struct (which also has "values") at the same time
const normalizedDefs = {} as RegistryTypes
Object.entries(defs).forEach(([typeName, typeDef]) => {
  if (typeof typeDef !== 'string' && !typeDef.hasOwnProperty('_enum') && !typeDef.hasOwnProperty('_set')) {
     // definition is a struct:
    const normalizedDef = {} as Record<string, string>
    Object.entries(typeDef).forEach(([key, value]) => {
      if ((emptyStruct as any)[key] !== undefined) {
        return
      }
      normalizedDef[key] = value as string
    })
    normalizedDefs[typeName] = normalizedDef;
  }
  else {
    normalizedDefs[typeName] = typeDef
  }
})


export default {
  types: normalizedDefs
}
