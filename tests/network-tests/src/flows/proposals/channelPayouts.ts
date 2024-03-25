import { channelPayoutProof } from '@joystream/js/content'
import BN from 'bn.js'
import path from 'path'
import { getChannelDefaults } from '../../fixtures/content/contentTemplates'
import { extendDebug } from '../../Debugger'
import { FixtureRunner } from '../../Fixture'
import {
  ClaimChannelRewardFixture,
  ClaimChannelRewardParams,
  cliExamplesFolderPath,
  CreateMembersFixture,
  UpdateChannelPayoutsProposalFixture,
  UpdateChannelPayoutsProposalParams,
  WithdrawChannelRewardFixture,
  WithdrawChannelRewardParams,
} from '../../fixtures/content'
import { FundCouncilBudgetFixture, FundCouncilBudgetParams } from '../../fixtures/council/FundCouncilBudgetFixture'
import { FlowProps } from '../../Flow'
import { Resource } from '../../Resources'
import { Utils } from '../../utils'
import { createJoystreamCli } from '../utils'
import { QueryNodeApi } from '../../QueryNodeApi'
import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'
import { ChannelPayoutsVector } from '@joystream/js/typings/ChannelPayoutsVector.schema'

export default async function channelPayouts({ api, query, lock }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:update-and-claim-channel-payouts')
  debug('Started')
  api.enableVerboseTxLogs()

  const unlock = await lock(Resource.Proposals)

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  const minCashout = await api.query.content.minCashoutAllowed()
  const councilBudget = minCashout.muln(6)
  const memberBalanceTopUp = councilBudget
    .add(new BN(await api.getDataObjectPerMegabyteFee()).muln(3))
    .add(new BN(await api.getDataObjectStateBloatBond()).muln(3))

  // create channel author and channel payouts proposer accounts
  const createMembersFixture = new CreateMembersFixture(api, query, 2, 0, memberBalanceTopUp)
  await new FixtureRunner(createMembersFixture).run()
  const [channelPayoutsProposer, channelOwner] = createMembersFixture.getCreatedItems().members

  // Fund council budget
  const fundCouncilBudgetParams: FundCouncilBudgetParams = {
    asMember: channelPayoutsProposer.memberId,
    amount: councilBudget,
    rationale: 'Funding council budget for paying channel rewards',
  }
  const fundCouncilBudgetFixture = new FundCouncilBudgetFixture(api, query, fundCouncilBudgetParams)
  await new FixtureRunner(fundCouncilBudgetFixture).runWithQueryNodeChecks()

  await joystreamCli.importAccount(channelOwner.keyringPair)
  // Channel claiming the payouts reward
  const rewardChannelId = await joystreamCli.createChannel(getChannelDefaults(cliExamplesFolderPath, false), [
    '--context',
    'Member',
    '--useMemberId',
    channelOwner.memberId.toString(),
  ])

  // We'll make 3 cashouts...
  for (let i = 1; i <= 3; ++i) {
    const payoutsVector: ChannelPayoutsVector = [
      // Some random channels
      {
        channelId: rewardChannelId + 1,
        cumulativeRewardEarned: minCashout.toString(),
        reason: 'Test: Random channel 1',
      },
      {
        channelId: rewardChannelId + 2,
        cumulativeRewardEarned: minCashout.toString(),
        reason: 'Test: Random channel 2',
      },
      // The reward channel
      {
        channelId: rewardChannelId,
        cumulativeRewardEarned: minCashout.muln(i).toString(),
        reason: 'Test: Reward channel',
      },
      // Some other random channels
      {
        channelId: rewardChannelId + 3,
        cumulativeRewardEarned: minCashout.toString(),
        reason: 'Test: Random channel 3',
      },
      {
        channelId: rewardChannelId + 4,
        cumulativeRewardEarned: minCashout.toString(),
        reason: 'Test: Random channel 4',
      },
    ]
    const channelPayoutsVectorFilePath = joystreamCli.getTmpFileManager().jsonFile(payoutsVector)
    const channelPayoutsPayloadFilePath = path.join(
      joystreamCli.getTmpFileManager().tmpDataDir,
      `payouts-payload-${i}.json`
    )

    // Generate protobuf serialized channel payouts payload and save it to the file
    await joystreamCli.generateChannelPayoutsPayload(channelPayoutsVectorFilePath, channelPayoutsPayloadFilePath)

    const updateChannelPayoutsParams: UpdateChannelPayoutsProposalParams = {
      asMember: channelPayoutsProposer.memberId,
      protobufPayloadFilePath: channelPayoutsPayloadFilePath,
    }

    // Update channel payouts
    const updateChannelPayoutsProposalFixture = new UpdateChannelPayoutsProposalFixture(
      api,
      query,
      updateChannelPayoutsParams
    )
    await new FixtureRunner(updateChannelPayoutsProposalFixture).run()

    const [channelPayoutsUpdatedEvent] = await query.mostRecentChannelPayoutsUpdatedEvent()
    debug('Channel payouts updated event:', channelPayoutsUpdatedEvent)

    // Council bag ID
    const COUNCIL_BAG_ID = 'static:council'

    // Upload channel payouts payload to the council bag
    Utils.assert(channelPayoutsUpdatedEvent.payloadDataObject, 'Payload data object missing!')
    await joystreamCli.reuploadAssets({
      bagId: COUNCIL_BAG_ID,
      assets: [{ objectId: channelPayoutsUpdatedEvent.payloadDataObject.id, path: channelPayoutsPayloadFilePath }],
    })

    // Fetch channel payout proof from payload data object in council bag
    const payoutProof = await fetchChannelPayoutProof(
      query,
      COUNCIL_BAG_ID,
      rewardChannelId,
      channelPayoutsUpdatedEvent.payloadDataObject.id
    )

    // Channel reward for given channel
    const claimChannelRewardParams: ClaimChannelRewardParams[] = [
      {
        asMember: channelOwner.memberId,
        payoutProof,
      },
    ]

    // Otherwise we claim and withdraw separately
    const claimChannelRewardFixture = new ClaimChannelRewardFixture(api, query, claimChannelRewardParams)
    await new FixtureRunner(claimChannelRewardFixture).runWithQueryNodeChecks()

    // Withdraw channel reward to destination account
    const withdrawChannelRewardParams: WithdrawChannelRewardParams[] = [
      {
        asMember: channelOwner.memberId,
        channelId: rewardChannelId,
        amount: minCashout,
      },
    ]
    const withdrawChannelRewardFixture = new WithdrawChannelRewardFixture(api, query, withdrawChannelRewardParams)
    await new FixtureRunner(withdrawChannelRewardFixture).runWithQueryNodeChecks()
  }

  unlock()

  debug('Done')
}

async function fetchChannelPayoutProof(
  query: QueryNodeApi,
  bagId: string,
  channelId: number,
  dataObjectId: string,
  retryTime = 6,
  retryCount = 5
): Promise<ChannelPayoutsMetadata.Body.ChannelPayoutProof> {
  for (let i = 0; i <= retryCount; ++i) {
    const nodesInfo = await query.storageNodesInfoByBagId(bagId)
    for (const info of nodesInfo) {
      try {
        const payoutProof = await channelPayoutProof(
          'URL',
          `${info.operatorMetadata?.nodeEndpoint}/api/v1/files/${dataObjectId}`,
          channelId
        )

        return payoutProof
      } catch (err) {
        continue
      }
    }
    if (i !== retryCount) {
      console.log(
        `No storage provider can serve the request yet, retrying in ${retryTime}s (${i + 1}/${retryCount})...`
      )
      await new Promise((resolve) => setTimeout(resolve, retryTime * 1000))
    }
  }

  throw new Error(`No storage provider could serve the updated channel payouts payload`)
}
