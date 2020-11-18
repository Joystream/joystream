const RuntimeAddressProvider = artifacts.require('RuntimeAddressProvider')
const MembershipBridge = artifacts.require('MembershipBridge')
const ContentWorkingGroupBridge = artifacts.require('ContentWorkingGroupBridge')

const RUNTIME_ADDRESS_INDEX = 0
const COUNCIL_ADDRESS_INDEX = 1
const MEMBER_1_ADDRESS_INDEX = 2

describe('Bridges', () => {
  let runtimeAddressProvider
  let membershipBridge
  let contentDirectoryBridge
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
  })

  it('should be initialized with test provider', async () => {
    assert.equal(await runtimeAddressProvider.runtimeAddress(), accounts[RUNTIME_ADDRESS_INDEX])
    assert.equal(await runtimeAddressProvider.councilAddress(), accounts[COUNCIL_ADDRESS_INDEX])
    assert.equal(await membershipBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
    assert.equal(await contentDirectoryBridge.runtimeAddressProvider(), runtimeAddressProvider.address)
  })

  it('should allow the runtime to set member controller address', async () => {
    await membershipBridge.setMemberAddress(1, accounts[MEMBER_1_ADDRESS_INDEX], {
      from: accounts[RUNTIME_ADDRESS_INDEX]
    })
    assert.isTrue(await membershipBridge.memberExists(1))
    assert.isTrue(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 1))
    assert.isFalse(await membershipBridge.isMemberController(accounts[MEMBER_1_ADDRESS_INDEX], 2))
    assert.isFalse(await membershipBridge.isMemberController(accounts[RUNTIME_ADDRESS_INDEX], 1))
  })
})
