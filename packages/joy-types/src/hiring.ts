import { Struct } from '@polkadot/types/codec'
import { getTypeRegistry, Text, u32 } from '@polkadot/types'
import { GenericJoyStreamRoleSchema } from './schemas/role.schema'
import ajv from 'ajv'

const schemaValidator = new ajv({allErrors: true}).compile(require('./schemas/role.schema.json'))

export class Opening extends Struct {
  constructor (value?: any) {
    super({
      created: u32, // BlockNumber
	  // missing fields. See https://github.com/bedeho/substrate-hiring-module/blob/initial_work/src/hiring.rs#L264
	  human_readable_text: Text,
    }, value);
  }

  get human_readable_text(): GenericJoyStreamRoleSchema | string | undefined {
	  const hrt = this.get('human_readable_text')

	  if (typeof hrt === "undefined") {
		  return undefined
	  }

	  const str = hrt.toString()

	  try {
	  const obj = JSON.parse(str)
	  if (schemaValidator(obj) === true) {
		  return obj as unknown as GenericJoyStreamRoleSchema
	  }
	  } catch(e) {
		  console.log("JSON schema validation failed:", e.toString())
	  }

	  return str
  }
}


export function registerHiringTypes () {
  try {
    const typeRegistry = getTypeRegistry();
    typeRegistry.register({
      Opening,
    });
  } catch (err) {
    console.error('Failed to register custom types of roles module', err);
  }
}
