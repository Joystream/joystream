import { FlowProps } from '../../Flow'
import {
  ApplyOnOpeningsHappyCaseFixture,
  ApplicantDetails,
  createDefaultOpeningParams,
} from '../../fixtures/workingGroups'
import { WorkingGroupModuleName } from '../../types'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import { AddStakingAccountsHappyCaseFixture, BuyMembershipHappyCaseFixture } from '../../fixtures/membership'
import { getWorkingGroupNameByModuleName, workingGroups } from '../../consts'
import { createType } from '@joystream/types'
import { CreateProposalsFixture, DecideOnProposalStatusFixture } from '../../fixtures/proposals'
import { Resource } from '../../Resources'
import { OpeningId, WorkerId } from '@joystream/types/primitives'

export default (skipIfAlreadySet = false, groups: WorkingGroupModuleName[] = workingGroups) =>
  async function leadOpening({ api, query, lock }: FlowProps): Promise<void> {
    await Promise.all(
      groups.map(async (group) => {
        const debug = extendDebug(`flow:lead-opening:${group}`)
        debug('Started')
        api.enableDebugTxLogs()
        const leadId = await api.query[group].currentLead()
        if (leadId.isSome) {
          if (skipIfAlreadySet) {
            debug('Leader already set, skipping...')
            return
          }
          throw new Error('Cannot hire lead - lead already set!')
        }

        const unlock = await lock(Resource.Proposals)
        // CANDIDATE buys membership
        const [roleAccount, stakingAccount, rewardAccount] = (await api.createKeyPairs(3)).map(({ key }) => key.address)
        const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [roleAccount])
        await new FixtureRunner(buyMembershipFixture).run()
        const [memberId] = buyMembershipFixture.getCreatedMembers()

        // CANDIDATE creates proposal for opening
        const openingParams = createDefaultOpeningParams(api)
        const createLeadOpeningProposalsFixture = new CreateProposalsFixture(api, query, [
          {
            type: 'CreateWorkingGroupLeadOpening',
            details: createType('PalletProposalsCodexCreateOpeningParameters', {
              'description': createType('Bytes', `Proposal to hire lead ${group}`),
              'stakePolicy': createType('PalletWorkingGroupStakePolicy', {
                'stakeAmount': openingParams.stake,
                'leavingUnstakingPeriod': openingParams.unstakingPeriod,
              }),
              'rewardPerBlock': openingParams.reward,
              'group': getWorkingGroupNameByModuleName(group),
            }),
            asMember: memberId,
            title: 'Proposal to Hired lead',
            description: `Proposal to hire lead ${group}`,
          },
        ])
        await new FixtureRunner(createLeadOpeningProposalsFixture).run()
        const [leadOpeningProposalId] = createLeadOpeningProposalsFixture.getCreatedProposalsIds()

        // COUNCIL approves and the proosal gets executed
        const decideOnLeadOpeningProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
          { proposalId: leadOpeningProposalId, status: 'Approved', expectExecutionFailure: false },
        ])
        await new FixtureRunner(decideOnLeadOpeningProposalStatusFixture).run()
        unlock()

        const openingsCreated = (
          await decideOnLeadOpeningProposalStatusFixture.getExecutionEvents(group, 'OpeningAdded')
        ).map((dispatchEvents) => {
          if (dispatchEvents) {
            return dispatchEvents.map((e) => e.data[0]) // first element in the tuple: Openingid
          } else {
            return undefined
          }
        })[0]
        const [openingId] = openingsCreated! as OpeningId[]

        // CANDIDATE stakes
        const addStakingAccFixture = new AddStakingAccountsHappyCaseFixture(api, query, [
          {
            asMember: memberId,
            account: stakingAccount,
          },
        ])
        await new FixtureRunner(addStakingAccFixture).run()
        await api.treasuryTransferBalance(stakingAccount, openingParams.stake)

        // CANDIDATE applies to position
        const applicantDetails: ApplicantDetails = {
          memberId,
          roleAccount,
          rewardAccount,
          stakingAccount,
        }
        const applyOnOpeningFixture = new ApplyOnOpeningsHappyCaseFixture(api, query, group, [
          {
            openingId,
            openingMetadata: openingParams.metadata,
            applicants: [applicantDetails],
          },
        ])
        const applicationRunner = new FixtureRunner(applyOnOpeningFixture)
        await applicationRunner.run()
        const [applicationId] = applyOnOpeningFixture.getCreatedApplicationsByOpeningId(openingId)

        // CANDIDATE fills opening
        const unlockFillPosition = await lock(Resource.Proposals)
        const createFillOpeningProposalsFixture = new CreateProposalsFixture(api, query, [
          {
            type: 'FillWorkingGroupLeadOpening',
            details: createType('PalletProposalsCodexFillOpeningParameters', {
              openingId,
              applicationId,
              workingGroup: getWorkingGroupNameByModuleName(group),
            }),
            asMember: memberId,
            title: 'Proposal to Fill lead opening',
            description: `Proposal to fill lead opeing for ${group}`,
          },
        ])
        await new FixtureRunner(createFillOpeningProposalsFixture).run()
        const [fillLeadOpeningProposalId] = createFillOpeningProposalsFixture.getCreatedProposalsIds()

        // COUNCIL approves and the proosal gets executed
        const decideOnFillLeadOpeningProposalStatusFixture = new DecideOnProposalStatusFixture(api, query, [
          { proposalId: fillLeadOpeningProposalId, status: 'Approved', expectExecutionFailure: false },
        ])
        await new FixtureRunner(decideOnFillLeadOpeningProposalStatusFixture).run()
        unlockFillPosition()

        const workerIds = (
          await decideOnFillLeadOpeningProposalStatusFixture.getExecutionEvents(group, 'LeaderSet')
        ).map((dispatchEvents) => {
          if (dispatchEvents) {
            return dispatchEvents.map((e) => e.data[0]) // first element in the tuple: Openingid
          } else {
            return undefined
          }
        })[0]

        const [workerId] = workerIds! as WorkerId[]
        debug(`position filled for ${group} by ${workerId}`)
        await api.assignWorkerWellknownAccount(group, workerId)

        debug('Done')
      })
    )
  }
