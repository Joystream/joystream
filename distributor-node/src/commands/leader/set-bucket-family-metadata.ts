import fs from 'fs'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase, { flags } from '../../command-base/default'
import { ValidationService } from '../../services/validation/ValidationService'
import {
  DistributionBucketFamilyMetadata,
  GeographicalArea,
  IDistributionBucketFamilyMetadata,
} from '@joystream/metadata-protobuf'
import { FamilyMetadataJson } from '../../types/generated/FamilyMetadataJson'
import { isValidCountryCode, isValidSubdivisionCode } from '@joystream/metadata-protobuf/utils'
import ExitCodes from '../../command-base/ExitCodes'

export default class LeaderSetBucketFamilyMetadata extends AccountsCommandBase {
  static description = `Set/update distribution bucket family metadata.
  Requires distribution working group leader permissions.`

  static flags = {
    familyId: flags.integer({
      char: 'f',
      description: 'Distribution bucket family id',
      required: true,
    }),
    input: flags.string({
      char: 'i',
      description: 'Path to JSON metadata file',
      required: true,
    }),
    ...DefaultCommandBase.flags,
  }

  parseAndValidateMetadata(input: FamilyMetadataJson): IDistributionBucketFamilyMetadata {
    const areas: IDistributionBucketFamilyMetadata['areas'] = []
    input.areas?.forEach((a) => {
      if ('continentCode' in a && a.continentCode) {
        areas.push({ continent: GeographicalArea.Continent[a.continentCode] })
        return
      }
      if ('countryCode' in a && a.countryCode) {
        if (!isValidCountryCode(a.countryCode)) {
          this.error(`Invalid country code: ${a.countryCode}`, { exit: ExitCodes.InvalidInput })
        }
        areas.push({ countryCode: a.countryCode })
        return
      }
      if ('subdivisionCode' in a && a.subdivisionCode) {
        if (!isValidSubdivisionCode(a.subdivisionCode)) {
          this.error(`Invalid subdivision code: ${a.subdivisionCode}`, { exit: ExitCodes.InvalidInput })
        }
        areas.push({ subdivisionCode: a.subdivisionCode })
        return
      }
      areas.push({})
    })

    const meta = { ...input, areas }
    const error = DistributionBucketFamilyMetadata.verify(meta)
    if (error) {
      this.error(`Metadata validation failed: ${error}`, { exit: ExitCodes.InvalidInput })
    }

    return meta
  }

  async run(): Promise<void> {
    const { familyId, input } = this.parse(LeaderSetBucketFamilyMetadata).flags
    const leadKey = await this.getDistributorLeadKey()

    const validation = new ValidationService()
    const metadataInput: FamilyMetadataJson = validation.validate(
      'FamilyMetadata',
      JSON.parse(fs.readFileSync(input).toString())
    )
    const metadata = this.parseAndValidateMetadata(metadataInput)

    this.log(`Setting bucket family metadata`, {
      familyId,
      metadata,
    })
    await this.sendAndFollowTx(
      await this.getDecodedPair(leadKey),
      this.api.tx.storage.setDistributionBucketFamilyMetadata(
        familyId,
        '0x' + Buffer.from(DistributionBucketFamilyMetadata.encode(metadata).finish()).toString('hex')
      )
    )
    this.log('Bucket family metadata succesfully set/updated!')
  }
}
