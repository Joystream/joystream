import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { InputParser, ExtrinsicsHelper, getInitializationInputs } from '@joystream/cd-schemas'
import { flags } from '@oclif/command'

export default class InitializeCommand extends ContentDirectoryCommandBase {
  static description =
    'Initialize content directory with input data from @joystream/content library or custom, provided one. Requires lead access.'

  static flags = {
    rootInputsDir: flags.string({
      required: false,
      description: 'Custom inputs directory (must follow @joystream/content directory structure)',
    }),
  }

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()
    await this.requestAccountDecoding(account)

    const {
      flags: { rootInputsDir },
    } = this.parse(InitializeCommand)

    const { classInputs, schemaInputs, entityBatchInputs } = getInitializationInputs(rootInputsDir)

    const currentClasses = await this.getApi().availableClasses()

    if (currentClasses.length) {
      this.log('There are already some existing classes in the current content directory.')
      await this.requireConfirmation('Do you wish to continue anyway?')
    }

    const txHelper = new ExtrinsicsHelper(this.getOriginalApi())
    const parser = new InputParser(this.getOriginalApi(), classInputs, schemaInputs, entityBatchInputs)

    this.log(`Initializing classes (${classInputs.length} input files found)...\n`)
    const classExtrinsics = parser.getCreateClassExntrinsics()
    await txHelper.sendAndCheck(account, classExtrinsics, 'Class initialization failed!')

    this.log(`Initializing schemas (${schemaInputs.length} input files found)...\n`)
    const schemaExtrinsics = await parser.getAddSchemaExtrinsics()
    await txHelper.sendAndCheck(account, schemaExtrinsics, 'Schemas initialization failed!')

    this.log(`Initializing entities (${entityBatchInputs.length} input files found)`)
    const entityOperations = await parser.getEntityBatchOperations()

    this.log(`Sending Transaction extrinsic (${entityOperations.length} operations)...\n`)
    await txHelper.sendAndCheck(
      account,
      [this.getOriginalApi().tx.contentDirectory.transaction({ Lead: null }, entityOperations)],
      'Entity initialization failed!'
    )

    this.log('DONE')
  }
}
