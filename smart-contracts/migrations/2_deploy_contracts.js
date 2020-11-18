const RuntimeAddressProvider = artifacts.require("RuntimeAddressProvider");
const ContentDirectory = artifacts.require("ContentDirectory");
const MembershipBridge = artifacts.require("MembershipBridge");
const ContentWorkingGroupBridge = artifacts.require("ContentWorkingGroupBridge");

const RUNTIME_ADDRESS = '0x2222222222222222222222222222222222222222';
const COUNCIL_ADDRESS = '0xcccccccccccccccccccccccccccccccccccccccc';

module.exports = function (deployer) {
	deployer
		.then(() => deployer.deploy(RuntimeAddressProvider, RUNTIME_ADDRESS, COUNCIL_ADDRESS))
		.then(() => deployer.deploy(MembershipBridge, RuntimeAddressProvider.address))
		.then(() => deployer.deploy(ContentWorkingGroupBridge, RuntimeAddressProvider.address))
		.then(() => deployer.deploy(ContentDirectory,
			RuntimeAddressProvider.address,
			MembershipBridge.address,
			ContentWorkingGroupBridge.address
		))
};

