import { FlowProps } from '../../Flow'
import { extendDebug } from '../../Debugger'
import { WorkingGroups } from '../../Api'
import { DistributorCLI } from '../../cli/distributor'
import { JoystreamCLI } from '../../cli/joystream'
import { StorageCLI } from '../../cli/storage'
import { BuyMembershipHappyCaseFixture } from '../../fixtures/membershipModule'
import { BN } from '@polkadot/util'
import { FixtureRunner } from '../../Fixture'
import { PublicApi as DistributorApi, Configuration as DistributorApiConfiguration } from '../../apis/distributorNode'
import { assert } from 'chai'
import { randomImgFile } from '../../cli/utils'

export default async function createChannel({ api, env }: FlowProps): Promise<void> {
  const debug = extendDebug('flow:createChannel')
  debug('Started')

  // Get working group leaders
  const distributionLeaderId = await api.getLeadWorkerId(WorkingGroups.DistributionWorkingGroup)
  const distributionLeader = await api.getGroupLead(WorkingGroups.DistributionWorkingGroup)
  const storageLeaderId = await api.getLeadWorkerId(WorkingGroups.StorageWorkingGroup)
  const storageLeader = await api.getGroupLead(WorkingGroups.StorageWorkingGroup)
  if (!distributionLeaderId || !distributionLeader || !storageLeaderId || !storageLeader) {
    throw new Error('Active storage and distributor leaders are required in this flow!')
  }
  const distributionLeaderSuri = api.getSuri(distributionLeader.role_account_id)
  const storageLeaderSuri = api.getSuri(storageLeader.role_account_id)

  // Create channel owner membership
  const [channelOwnerKeypair] = await api.createKeyPairs(1)
  const paidTermId = api.createPaidTermId(new BN(+(env.MEMBERSHIP_PAID_TERMS || 0)))
  const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, [channelOwnerKeypair.address], paidTermId)
  await new FixtureRunner(buyMembershipFixture).run()

  // Send some funds to pay the deletion_prize
  const channelOwnerBalance = new BN(100)
  await api.treasuryTransferBalance(channelOwnerKeypair.address, channelOwnerBalance)

  // Create CLI's
  const distributorCli = new DistributorCLI([distributionLeaderSuri])
  const joystreamCli = new JoystreamCLI()
  const storageCli = new StorageCLI(storageLeaderSuri)

  // Spawn storage node and distributor node servers
  const storageServerProcess = await storageCli.spawnServer(storageLeaderId)
  const distributorServerProcess = await distributorCli.spawnServer(distributionLeaderId)

  // Import & select channel owner key in Joystream CLI
  await joystreamCli.importKey(channelOwnerKeypair)
  await joystreamCli.run('account:choose', ['--address', channelOwnerKeypair.address])

  // Create channel
  const { out: createChannelOut } = await joystreamCli.createChannel(
    {
      title: 'Test channel',
      avatarPhotoPath: randomImgFile(300, 300),
      coverPhotoPath: randomImgFile(1920, 500),
      description: 'This is a test channel',
      isPublic: true,
      language: 'EN',
      rewardAccount: channelOwnerKeypair.address,
    },
    ['--context', 'Member']
  )

  const assetIds = Array.from(createChannelOut.matchAll(/Uploading object ([0-9]+)/g)).map((res) => res[1])
  if (!assetIds.length) {
    throw new Error(`No uploaded asset ids found in createChannel output:\n${createChannelOut}`)
  }

  // TODO: Get asset ids etc. from query node

  // Request asset from distributor node
  const distributorApi = new DistributorApi(
    new DistributorApiConfiguration({ basePath: 'http://localhost:3334/api/v1' })
  )
  await Promise.all(
    assetIds.map(async (id) => {
      const response = await distributorApi.publicAsset(id)
      assert.equal(response.status, 200)
    })
  )

  // Expect successful response & nodes to be alive
  storageServerProcess.expectAlive()
  distributorServerProcess.expectAlive()

  storageServerProcess.kill()
  distributorServerProcess.kill()

  debug('Done')
}
