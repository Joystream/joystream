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

  // const limit = api.consts.utility.batchedCallsLimit.toNumber()
  // console.log(`Calls limit ${limit}`)
  // Limit is approx 10922
  const batch = createCalls(remark, 1400, 1) // this on its own can pass all extrinc checks
  const tx = createCalls(batch, 200, 1) // causes mem allocation failure
  await tx.signAndSend(sender)
}

if (typeof module === 'undefined') {
  // Polkadot-js/apps js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
