/* global api, hashing, keyring, types, util, joy, window */

// run this script with:
// yarn workspace api-scripts script test-utils-batch
//
// or copy and paste the code into the Polkadot-js/apps javascript toolbox at:
// https://polkadot.js.org/apps/#/js
//

// Running this script with runtime configured with significantly larger
// MAXIMUM_BLOCK_WEIGHT (Which also gives us larger tx weight limit) and BlockLength
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

  const remark = api.tx.system.remark([])

  function createCalls(tx, length, depth = 1) {
    if (length === 0) {
      return []
    }

    const calls = []

    for (let n = 0; n < length; n++) {
      if (depth > 1) {
        calls.push(createCalls(tx, length, depth - 1))
      } else {
        calls.push(tx)
      }
    }

    return api.tx.utility.batch(calls)
  }

  const nonce = (await api.query.system.account(destination)).nonce.toNumber()
  const signedTxs = []
  for (let n = 0; n < 100; n++) {
    const batch = createCalls(remark, 1400 + n, 1)
    const tx = createCalls(batch, 200, 1)
    signedTxs.push(tx.sign(sender, { nonce: nonce + n }))
    console.log('signed', n)
  }

  console.log('sending transactions')
  const hashes = await Promise.all(signedTxs.map((tx) => tx.send()))
  hashes.forEach(console.log)
}

if (typeof module === 'undefined') {
  // Polkadot-js/apps js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
