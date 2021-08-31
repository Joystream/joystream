/* global api, hashing, keyring, types, util, joy, window */

// run this script with:
// yarn workspace api-scripts script set-sudo-as-screening-auth
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
//
// requires nicaea release+

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

  const tx = api.tx.members.setScreeningAuthority(sudoAddress)

  const nonce = (await api.query.system.account(sudoAddress)).nonce
  const sudoTx = api.tx.sudo.sudo(tx)
  const signed = sudoTx.sign(sudo, { nonce })
  await signed.send()

  console.log(`sent tx with nonce: ${nonce.toNumber()}, tx hash: ${signed.hash}`)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
