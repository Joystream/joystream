import { Constructor, Registry } from '@polkadot/types/types'
import { Enum } from '@polkadot/types/codec'
import { EnumConstructor } from '@polkadot/types/codec/Enum'

export interface ExtendedEnum<Types extends Record<string, Constructor>> extends Enum {
  isOfType: (type: keyof Types) => boolean
  asType<TypeKey extends keyof Types>(type: TypeKey): InstanceType<Types[TypeKey]>
  typeDefinitions: Types
  type: keyof Types & string // More typesafe type for the original Enum property
}

export interface ExtendedEnumConstructor<Types extends Record<string, Constructor>>
  extends EnumConstructor<ExtendedEnum<Types>> {
  create<TypeKey extends keyof Types>(
    registry: Registry,
    typeKey: TypeKey,
    value: InstanceType<Types[TypeKey]>
  ): ExtendedEnum<Types>
  typeDefinitions: Types
}

// Helper for creating extended Enum type with TS-compatible isOfType and asType helpers
export function JoyEnum<Types extends Record<string, Constructor>>(types: Types): ExtendedEnumConstructor<Types> {
  return class JoyEnumObject extends Enum.with(types) {
    static typeDefinitions = types
    typeDefinitions = JoyEnumObject.typeDefinitions // Non-static version
    public static create<TypeKey extends keyof Types>(
      registry: Registry,
      typeKey: TypeKey,
      value: InstanceType<Types[TypeKey]>
    ) {
      return new JoyEnumObject(registry, { [typeKey]: value })
    }
    constructor(registry: Registry, value?: any, index?: number) {
      super(registry, value, index)
    }
    public isOfType(typeKey: keyof Types) {
      return this.type === typeKey
    }
    public asType<TypeKey extends keyof Types>(typeKey: TypeKey) {
      if (!this.isOfType(typeKey)) {
        throw new Error(`Enum.asType(${typeKey}) - value is not of type ${typeKey}`)
      }
      return this.value as InstanceType<Types[TypeKey]>
    }
  }
}
