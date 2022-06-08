/* global api, hashing, keyring, types, util, joy, window */

// run this script with:
// yarn workspace api-scripts script test-transfer
//
// or copy and paste the code into the Polkadot-js/apps javascript toolbox at:
// https://polkadot.js.org/apps/#/js
//

const script = async ({ api, keyring, userAddress }) => {
  const sudoAddress = (await api.query.sudo.key()).toString()
  const destination = userAddress || sudoAddress
  let sender
  if (typeof window === 'undefined') {
    // In node, get the keyPair if the keyring was provided
    sender = keyring.getPair(destination)
  } else {
    // Polkadot-js/apps: let the UI Signer handle it
    sender = destination
  }

  // Send test transfer to self
  const transfer = api.tx.balances.transfer(destination, 10)
  await transfer.signAndSend(sender)
}

if (typeof module === 'undefined') {
  // Polkadot-js/apps js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
