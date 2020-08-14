/* global api, hashing, keyring, types, util, window */

// run this script with:
// yarn script testTransfer
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
//

const script = async ({ api, keyring }) => {
  const sudoAddress = (await api.query.sudo.key()).toString()
  let sudo
  if (typeof window === 'undefined') {
    // In node, get the keyPair if the keyring was provided
    sudo = keyring.getPair(sudoAddress)
  } else {
    // Pioneer: let the UI Signer handle it
    sudo = sudoAddress
  }

  const transfer = api.tx.balances.transfer(sudoAddress, 100)
  await transfer.signAndSend(sudo)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util })
} else {
  // Node
  module.exports = script
}
