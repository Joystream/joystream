/* global api, hashing, keyring, types, util, joy */

// run this script with:
// yarn workspace api-scripts script list-data-directory
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
// requires nicaea release+

const script = async ({ api }) => {
  const entries = await api.query.dataDirectory.dataByContentId.entries()

  console.error(`Data Directory contains ${entries.length} objects`)

  const acceptedEntries = entries.filter(([, dataObject]) => dataObject.liaison_judgement.type === 'Accepted')

  acceptedEntries.forEach(
    ([
      {
        args: [id],
      },
      obj,
    ]) => {
      console.log(`contentId: ${api.createType('ContentId', id).encode()}, ipfs: ${obj.ipfs_content_id}`)
    }
  )

  console.error(`Data Directory contains ${acceptedEntries.length} Accepted objects`)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
