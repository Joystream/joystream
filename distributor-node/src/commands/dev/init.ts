import { MemberId } from '@joystream/types/members'
import AccountsCommandBase from '../../command-base/accounts'
import DefaultCommandBase from '../../command-base/default'

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

export default class DevInit extends AccountsCommandBase {
  static description = 'Initialize development environment. Sets Alice as distributor working group leader.'

  static flags = {
    ...DefaultCommandBase.flags,
  }

  async run(): Promise<void> {
    const { api } = this

    if (!api.isDevelopment) {
      this.error('Not connected to dev chain!')
    }

    const SudoKeyPair = this.getPair(ALICE)
    const LeadKeyPair = this.getPair(ALICE)

    // Create membership if not already created
    const members = await api.query.members.memberIdsByControllerAccountId(LeadKeyPair.address)

    let memberId: MemberId | undefined = members.toArray()[0]

    if (memberId === undefined) {
      const res = await this.api.sendExtrinsic(LeadKeyPair, api.tx.members.buyMembership(0, 'alice', null, null))
      memberId = this.api.getEvent(res, 'members', 'MemberRegistered').data[0]
    }

    // Create a new lead opening.
    const currentLead = await api.query.distributionWorkingGroup.currentLead()
    if (currentLead.isSome) {
      this.log('Distributor lead already exists, skipping...')
      return
    }

    this.log(`Making member id: ${memberId} the distribution lead.`)

    // Create curator lead opening
    const addOpeningRes = await this.api.sendExtrinsic(
      SudoKeyPair,
      this.api.sudo(
        api.tx.distributionWorkingGroup.addOpening(
          { CurrentBlock: null },
          { max_review_period_length: 9999 },
          'dev distributor lead opening',
          'Leader'
        )
      )
    )

    const openingAddedEvent = this.api.getEvent(addOpeningRes, 'distributionWorkingGroup', 'OpeningAdded')
    const openingId = openingAddedEvent.data[0]

    // Apply to lead opening
    const applyRes = await this.api.sendExtrinsic(
      LeadKeyPair,
      this.api.tx.distributionWorkingGroup.applyOnOpening(
        memberId, // member id
        openingId, // opening id
        LeadKeyPair.address, // address
        null, // opt role stake
        null, // opt appl. stake
        'dev distributor lead application' // human_readable_text
      )
    )

    const appliedEvent = this.api.getEvent(applyRes, 'distributionWorkingGroup', 'AppliedOnOpening')
    const applicationId = appliedEvent.data[1]

    // Begin review period
    await this.api.sendExtrinsic(
      SudoKeyPair,
      this.api.sudo(this.api.tx.distributionWorkingGroup.beginApplicantReview(openingId))
    )

    // Fill opening
    await this.api.sendExtrinsic(
      SudoKeyPair,
      this.api.sudo(
        this.api.tx.distributionWorkingGroup.fillOpening(
          openingId,
          api.createType('ApplicationIdSet', [applicationId]),
          null
        )
      )
    )
  }
}
