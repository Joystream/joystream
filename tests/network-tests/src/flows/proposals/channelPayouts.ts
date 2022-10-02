import { channelPayoutProof } from '@joystreamjs/content'
import BN from 'bn.js'
import fs from 'fs'
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
import { QueryNodeApi } from 'src/QueryNodeApi'
import { ChannelPayoutsMetadata } from '@joystream/metadata-protobuf'

export default async function channelPayouts({ api, query, lock, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:update-and-claim-channel-payouts')
  debug('Started')
  api.enableVerboseTxLogs()

  const unlock = await lock(Resource.Proposals)

  // create Joystream CLI
  const joystreamCli = await createJoystreamCli()

  // some very big number to cover fees of all transactions
  const sufficientTopupAmount = new BN(10_000_000_000_000)

  // create channel author and channel payouts proposer accounts
  const createMembersFixture = new CreateMembersFixture(api, query, 2, 0, sufficientTopupAmount)
  await new FixtureRunner(createMembersFixture).run()
  const [channelPayoutsProposer, channelOwner] = createMembersFixture.getCreatedItems().members

  // Fund council budget
  const fundCouncilBudgetParams: FundCouncilBudgetParams = {
    asMember: channelPayoutsProposer.memberId,
    amount: sufficientTopupAmount.divn(2),
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

  const channelPayoutsVectorFilePath = `${cliExamplesFolderPath}/${env.CHANNEL_PAYOUTS_VECTOR_FILE}`
  const protobufPayloadFilePath =
    path.dirname(require.resolve('network-tests/package.json')) + '/data/joystream-testing/channelPayouts'
  Utils.assert(
    channelPayoutsVectorFilePath && fs.existsSync(channelPayoutsVectorFilePath),
    'Invalid CHANNEL_PAYOUTS_VECTOR_FILE'
  )

  // Generate protobuf serialized channel payouts payload and save it to the file
  await joystreamCli.generateChannelPayoutsPayload(channelPayoutsVectorFilePath, protobufPayloadFilePath)

  const updateChannelPayoutsParams: UpdateChannelPayoutsProposalParams = {
    asMember: channelPayoutsProposer.memberId,
    uploaderAccount: channelPayoutsProposer.account,
    protobufPayloadFilePath,
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
  await joystreamCli.reuploadAssets({
    bagId: COUNCIL_BAG_ID,
    assets: [{ objectId: channelPayoutsUpdatedEvent.payloadDataObject.id, path: protobufPayloadFilePath }],
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
  const claimChannelRewardFixture = new ClaimChannelRewardFixture(api, query, claimChannelRewardParams)
  await new FixtureRunner(claimChannelRewardFixture).runWithQueryNodeChecks()

  // Withdraw channel reward to destination account
  const withdrawChannelRewardParams: WithdrawChannelRewardParams[] = [
    {
      asMember: channelOwner.memberId,
      channelId: rewardChannelId,
      amount: new BN(payoutProof.cumulativeRewardEarned),
    },
  ]
  const withdrawChannelRewardFixture = new WithdrawChannelRewardFixture(api, query, withdrawChannelRewardParams)
  await new FixtureRunner(withdrawChannelRewardFixture).runWithQueryNodeChecks()

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
