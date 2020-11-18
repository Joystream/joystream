const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
const MembershipBridge = artifacts.require('MembershipBridge')
const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')
const ChannelStorage = artifacts.require('ChannelStorage')
const VideoStorage = artifacts.require('VideoStorage')
const CuratorGroupStorage = artifacts.require('CuratorGroupStorage')
const ContentDirectory = artifacts.require('ContentDirectory')

const RUNTIME_ADDRESS_INDEX = 0
const COUNCIL_ADDRESS_INDEX = 1
const MEMBER_1_ADDRESS_INDEX = 2
const MEMBER_2_ADDRESS_INDEX = 3

// Mimic the Solidity enum:
const ChannelOwnerType = {
  Address: 0,
  Member: 1,
  CuratorGroup: 2
}

describe('ContentDirectory', () => {
  let runtimeAddressProvider
  let membershipBridge
  let contentDirectoryBridge
  let contentDirectory
  let accounts

  before(async () => {
    accounts = await web3.eth.getAccounts()
    // Create new provider with available accounts set as runtime and council addresses
    runtimeAddressProvider = await RuntimeAddressProvider.new(
      accounts[RUNTIME_ADDRESS_INDEX],
      accounts[COUNCIL_ADDRESS_INDEX]
    )
    // Instantialize bridges with the test RuntimeAddressProvider
    membershipBridge = await MembershipBridge.new(runtimeAddressProvider.address)
    contentDirectoryBridge = await ContentWorkingGroupBridge.new(runtimeAddressProvider.address)
    // Add members
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX]
    })
    await membershipBridge.setMemberAddress(2, accounts[MEMBER_2_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX]
    })
    // Instantialize the main content directory contract
    contentDirectory = await ContentDirectory.new(
      runtimeAddressProvider.address,
      membershipBridge.address,
      contentDirectoryBridge.address
    )
  })

  it('should allow the member to create a channel', async () => {
    await contentDirectory.createChannel(
      [ChannelOwnerType.Member, 1],
      [
        ['title', 'Awesome channel'],
        ['description', 'This is an awesome channel']
      ],
      { from: accounts[MEMBER_1_ADDRESS_INDEX] }
    )

    const channelStorage = await ChannelStorage.at(await contentDirectory.channelStorage())

    assert.equal(await channelStorage.nextChannelId(), 2)
    assert.equal(await channelStorage.channelCountByOwnership(ChannelOwnerType.Member, 1), 1)

    await channelStorage.getExistingChannel(1)
  })

  it('should allow the member to update a channel', async () => {
    const updateProps = [['title', 'Awesome updated channel']];
    const res = await contentDirectory.updateChannelMetadata(
      1,
      updateProps,
      { from: accounts[MEMBER_1_ADDRESS_INDEX] }
    )

    assert.equal(res.logs[0].event, 'ChannelMetadataUpdated')
    assert.equal(res.logs[0].args[0], 1)
    assert.sameDeepMembers(res.logs[0].args[1], updateProps)
  })
})
