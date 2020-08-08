/* global api, hashing, keyring, types, util, window, joy */

// run this script with:
// yarn script example
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
// 
// Example works on nicaea release+

const script = async ({ api, hashing, keyring, types, util, joy }) => {
  // Retrieve the chain & node information information via rpc calls
  const [chain, nodeName, nodeVersion, runtimeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
    api.runtimeVersion,
  ]);

  console.log(`Chain: ${chain}`)
  console.log(`Software: ${nodeName} v${nodeVersion}`)
  console.log(`Runtime specVersion: ${runtimeVersion.specVersion}`)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  // Available globals [api, hashing, keyring, types, util]
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
