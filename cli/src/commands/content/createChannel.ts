import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import CreateClassSchema from '@joystream/cd-schemas/schemas/extrinsics/CreateClass.schema.json'
import { CreateClass } from '@joystream/cd-schemas/types/extrinsics/CreateClass'
import { InputParser } from '@joystream/cd-schemas'
import { JSONSchema } from '@apidevtools/json-schema-ref-parser'
import { IOFlags, getInputJson, saveOutputJson } from '../../helpers/InputOutput'

export default class CreateChannelCommand extends ContentDirectoryCommandBase {
  static description = 'Create channel inside content directory.'
  static flags = {
    context: ContentDirectoryCommandBase.contextFlag,
    ...IOFlags,
  }

  async run() {
    let { context, input, output } = this.parse(CreateChannelCommand).flags

    if (!context) {
      context = await this.promptForContext()
    }


    // let inputJson = await getInputJson<CreateClass>(input, CreateClassSchema as JSONSchema)

    // this.jsonPrettyPrint(JSON.stringify(inputJson))
    // const confirmed = await this.simplePrompt({ type: 'confirm', message: 'Do you confirm the provided input?' })

    // if (confirmed) {
    //   saveOutputJson(output, `${inputJson.name}Class.json`, inputJson)
    //   this.log('Sending the extrinsic...')
    //   const inputParser = new InputParser(this.getOriginalApi())
    //   await this.sendAndFollowTx(account, inputParser.parseCreateClassExtrinsic(inputJson))
    // }
  }
}
