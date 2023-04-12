import ContentDirectoryCommandBase from '../../base/ContentDirectoryCommandBase'
import { displayCollapsedRow } from '../../helpers/display'

export default class GetPayoutsOnchainCommitment extends ContentDirectoryCommandBase {
  static description = 'Get on-chain commitment (merkle root) for channel payouts payload.'

  async run(): Promise<void> {
    // Context

    const commitment = (await this.getOriginalApi().query.content.commitment()).toString()
    displayCollapsedRow({
      'On-chain Commitment': commitment,
    })
  }
}
