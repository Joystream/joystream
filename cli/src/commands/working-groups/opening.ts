import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { displayTable, displayCollapsedRow, displayHeader, shortAddress, memberHandle } from '../../helpers/display'
import { formatBalance } from '@polkadot/util'
import { flags } from '@oclif/command'
import moment from 'moment'
import { OpeningDetails } from '../../Types'
import chalk from 'chalk'
import ExitCodes from '../../ExitCodes'
import { UpcomingWorkingGroupOpeningDetailsFragment } from '../../graphql/generated/queries'

export default class WorkingGroupsOpening extends WorkingGroupsCommandBase {
  static description = 'Shows detailed information about working group opening / upcoming opening by id'

  static flags = {
    id: flags.string({
      required: true,
      description: 'Opening / upcoming opening id (depending on --upcoming flag)',
    }),
    upcoming: flags.boolean({
      description: 'Whether the opening is an upcoming opening',
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  openingDetails(opening: OpeningDetails) {
    displayHeader('Opening details')
    displayCollapsedRow({
      'Opening ID': opening.openingId,
      'Opening type': opening.type.type,
      'Created': `#${opening.createdAtBlock}`,
      'Reward per block': opening.rewardPerBlock ? formatBalance(opening.rewardPerBlock) : '-',
    })
  }

  openingStakingPolicy(opening: OpeningDetails) {
    displayHeader('Staking policy')
    displayCollapsedRow({
      'Stake amount': formatBalance(opening.stake.value),
      'Unstaking period': opening.stake.unstakingPeriod.toLocaleString() + ' blocks',
    })
  }

  upcomingOpeningDetails(upcomingOpening: UpcomingWorkingGroupOpeningDetailsFragment) {
    displayHeader('Upcoming opening details')
    displayCollapsedRow({
      'Upcoming Opening ID': upcomingOpening.id,
      'Expected start': upcomingOpening.expectedStart ? moment(upcomingOpening.expectedStart).format('YYYY-mm-dd HH:ii:ss') : '?',
      'Reward per block': upcomingOpening.rewardPerBlock ? formatBalance(upcomingOpening.rewardPerBlock) : '?',
    })
  }

  upcomingOpeningStakingPolicy(upcomingOpening: UpcomingWorkingGroupOpeningDetailsFragment) {
    if (upcomingOpening.stakeAmount) {
      displayHeader('Staking policy')
      displayCollapsedRow({
        'Stake amount': formatBalance(upcomingOpening.stakeAmount),
      })
    }
  }

  openingMetadata(opening: OpeningDetails | UpcomingWorkingGroupOpeningDetailsFragment) {
    const { metadata } = opening
    if (metadata) {
      displayHeader('Metadata')
      this.jsonPrettyPrint(
        JSON.stringify({
          ...metadata,
          applicationFormQuestions: metadata.applicationFormQuestions.map(({ question, type }) => ({
            question,
            type,
          })),
          expectedEnding: metadata.expectedEnding
            ? moment(metadata.expectedEnding).format('YYYY-MM-DD HH:mm:ss')
            : undefined,
        })
      )
    }
  }

  openingApplications(opening: OpeningDetails) {
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

  async run(): Promise<void> {
    const { id, upcoming } = this.parse(WorkingGroupsOpening).flags

    if (upcoming) {
      const upcomingOpening = await this.getQNApi().upcomingWorkingGroupOpeningById(id)
      if (!upcomingOpening) {
        this.error(`Upcoming opening by id ${chalk.magentaBright(id)} was not found!`, { exit: ExitCodes.InvalidInput })
      }
      this.upcomingOpeningDetails(upcomingOpening)
      this.upcomingOpeningStakingPolicy(upcomingOpening)
      this.openingMetadata(upcomingOpening)
    } else {
      const opening = await this.getApi().groupOpening(this.group, parseInt(id))
      this.openingDetails(opening)
      this.openingStakingPolicy(opening)
      this.openingMetadata(opening)
      this.openingApplications(opening)
    }
  }
}
