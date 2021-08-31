/* global api, hashing, keyring, types, util, joy, window */

// run this script with:
// yarn workspace api-scripts script test-transfer
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
//

const script = async ({ api, keyring, userAddress }) => {
  const sudoAddress = (await api.query.sudo.key()).toString()
  const destination = userAddress || sudoAddress
  let sender
  if (typeof window === 'undefined') {
    // In node, get the keyPair if the keyring was provided
    sender = keyring.getPair(destination)
  } else {
    // Pioneer: let the UI Signer handle it
    sender = destination
  }

  // Send test transfer to self
  const transfer = api.tx.balances.transfer(destination, 10)
  await transfer.signAndSend(sender)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
