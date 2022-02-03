import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayTable, displayCollapsedRow, displayHeader, shortAddress, memberHandle } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'
import moment from 'moment'

export default class WorkingGroupsOpening extends WorkingGroupsCommandBase {
  static description = 'Shows an overview of given working group opening by Working Group Opening ID'
  static args = [
    {
      name: 'wgOpeningId',
      required: true,
      description: 'Working Group Opening ID',
    },
  ]

  static flags = {
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    const { args } = this.parse(WorkingGroupsOpening)

    const opening = await this.getApi().groupOpening(this.group, parseInt(args.wgOpeningId))

    displayHeader('Opening details')
    const openingRow = {
      'Opening ID': opening.openingId,
      'Opening type': opening.type.type,
      'Created': `#${opening.createdAtBlock}`,
      'Reward per block': formatBalance(opening.rewardPerBlock),
    }
    displayCollapsedRow(openingRow)

    displayHeader('Staking policy')
    if (opening.stake) {
      const stakingRow = {
        'Stake amount': formatBalance(opening.stake.value),
        'Unstaking period': opening.stake.unstakingPeriod.toLocaleString() + ' blocks',
      }
      displayCollapsedRow(stakingRow)
    } else {
      this.log('NONE')
    }

    if (opening.metadata) {
      delete (opening.metadata as any).__typename
      displayHeader('Metadata')
      this.jsonPrettyPrint(
        JSON.stringify({
          ...opening.metadata,
          applicationFormQuestions: opening.metadata.applicationFormQuestions.map(({ question, type }) => ({
            question,
            type,
          })),
          expectedEnding: opening.metadata.expectedEnding
            ? moment(opening.metadata.expectedEnding).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
        })
      )
    }

    displayHeader(`Applications (${opening.applications.length})`)
    const applicationsRows = opening.applications.map((a) => ({
      'ID': a.applicationId,
      Member: memberHandle(a.member),
      'Role Acc': shortAddress(a.roleAccout),
      'Reward Acc': shortAddress(a.rewardAccount),
      'Staking Acc': a.stakingAccount ? shortAddress(a.stakingAccount) : 'NONE',
    }))
    displayTable(applicationsRows, 5)
  }
}
