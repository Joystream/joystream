import WorkingGroupsCommandBase from '../../base/WorkingGroupsCommandBase'
import { apiModuleByGroup } from '../../Api'
import chalk from 'chalk'
import { createType } from '@joystream/types'
import { flags } from '@oclif/command'

export default class WorkingGroupsFillOpening extends WorkingGroupsCommandBase {
  static description = "Allows filling working group opening that's currently in review. Requires lead access."

  static flags = {
    openingId: flags.integer({
      required: true,
      description: 'Working Group Opening ID',
    }),
    applicationIds: flags.integer({
      multiple: true,
      description: 'Accepted application ids',
    }),
    ...WorkingGroupsCommandBase.flags,
  }

  async run(): Promise<void> {
    let { openingId, applicationIds } = this.parse(WorkingGroupsFillOpening).flags

    // Lead-only gate
    const lead = await this.getRequiredLeadContext()

    const opening = await this.getOpeningForLeadAction(openingId)

    if (!applicationIds || !applicationIds.length) {
      applicationIds = await this.promptForApplicationsToAccept(opening)
    }

    await this.sendAndFollowNamedTx(
      await this.getDecodedPair(lead.roleAccount),
      apiModuleByGroup[this.group],
      'fillOpening',
      [openingId, createType('BTreeSet<ApplicationId>', applicationIds)]
    )

    this.log(chalk.green(`Opening ${chalk.magentaBright(openingId.toString())} successfully filled!`))
    this.log(
      chalk.green('Accepted working group application IDs: ') +
        chalk.magentaBright(applicationIds.length ? applicationIds.join(chalk.green(', ')) : 'NONE')
    )
  }
}
