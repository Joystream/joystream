/* global api, hashing, keyring, types, util, joy, window */

// run this script with:
// yarn script injectDataObjects
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
//
// requires nicaea release+

const script = async ({ api, keyring }) => {
  // map must be sorted or we get BadProof error when transaction is submitted and decoded by
  // the node. Make sure they are exported in sorted order
  // Example
  const exported = `
    [
      [
        "0x024d7e659d98d537e11f584a411a109f823be28c2e33d5fd5bc83705459442d9",
        {
          "owner":442,
          "added_at": {"block":1128903,"time":1591306668000},
          "type_id":1,
          "size":219008840,
          "liaison":0,
          "liaison_judgement":1,
          "ipfs_content_id":"Qmc5fAfRUXnHHtXo2dzKG4qMxQU8rz49meRapvmBsGF5cA"
        }
      ]
    ]
  `
  const parsed = JSON.parse(exported)

  const sudoAddress = (await api.query.sudo.key()).toString()
  let sudo
  if (typeof window === 'undefined') {
    // In node, get the keyPair if the keyring was provided
    sudo = keyring.getPair(sudoAddress)
  } else {
    // Pioneer: let the UI Signer handle it
    sudo = sudoAddress
  }

  let nonce = (await api.query.system.account(sudoAddress)).nonce
  const max = api.consts.dataDirectory.maxObjectsPerInjection.toNumber()

  const preInjectionIds = await api.query.dataDirectory.knownContentIds()
  console.log(`Before injection there are ${preInjectionIds.length} known object ids`)

  // split injection into batches of max objects
  while (parsed.length) {
    const batch = parsed.splice(0, max)
    const objectsMap = api.createType('DataObjectsMap') // new joy.media.DataObjectsMap(api.registry)
    batch.forEach(([id, object]) => {
      objectsMap.set(api.createType('ContentId', id), api.createType('DataObject', object))
    })

    const injectTx = api.tx.dataDirectory.injectDataObjects(objectsMap)
    const sudoTx = api.tx.sudo.sudo(injectTx)
    console.log(`injecting ${batch.length} objects`)
    const signed = sudoTx.sign(sudo, { nonce })
    await signed.send()
    console.log(`nonce: ${nonce.toNumber()}, tx hash: ${signed.hash}`)
    nonce = nonce.addn(1)
  }
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
