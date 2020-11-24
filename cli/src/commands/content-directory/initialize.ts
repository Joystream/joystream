import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { CreateClass } from 'cd-schemas/types/extrinsics/CreateClass'
import { getInputs, InputParser, ExtrinsicsHelper } from 'cd-schemas'
import { AddClassSchema } from 'cd-schemas/types/extrinsics/AddClassSchema'
import { EntityBatch } from 'cd-schemas/types/EntityBatch'

export default class InitializeCommand extends ContentDirectoryCommandBase {
  static description =
    'Initialize content directory with input data from @joystream/content library. Requires lead access.'

  async run() {
    const account = await this.getRequiredSelectedAccount()
    await this.requireLead()
    await this.requestAccountDecoding(account)

    const classInputs = getInputs<CreateClass>('classes').map(({ data }) => data)
    const schemaInputs = getInputs<AddClassSchema>('schemas').map(({ data }) => data)
    const entityBatchInputs = getInputs<EntityBatch>('entityBatches').map(({ data }) => data)

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
