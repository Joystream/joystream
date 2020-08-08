/* global api, hashing, keyring, types, util */

// run this script with:
// yarn script listDataDirectory
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
// requires nicaea release+

const script = async ({ api, joy }) => {
  const ids = await api.query.dataDirectory.knownContentIds()

  await Promise.all(ids.map(async (id) => {
    let obj = await api.query.dataDirectory.dataObjectByContentId(id)
    if (obj.isNone) { return }
    obj = obj.unwrap()
    console.log(`contentId: ${new joy.media.ContentId(id).encode()}, ipfs: ${obj.ipfs_content_id}`)
  }))

  console.error(`Data Directory contains ${ids.length} objects`)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
