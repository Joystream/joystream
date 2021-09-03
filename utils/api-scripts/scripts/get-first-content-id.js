/* global api, hashing, keyring, types, util, joy */

// run this script with:
// yarn workspace api-scripts script get-first-content-id
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js
// requires nicaea release+

const script = async ({ api }) => {
  const entries = await api.query.dataDirectory.dataByContentId.entries()
  const acceptedEntries = entries.filter(([, dataObject]) => dataObject.liaison_judgement.type === 'Accepted')
  if (acceptedEntries.length) {
    const [
      {
        args: [id],
      },
    ] = acceptedEntries[0]
    console.log(`${api.createType('ContentId', id).encode()}`)
  }
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
