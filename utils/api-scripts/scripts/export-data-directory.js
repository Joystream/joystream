/* global api, hashing, keyring, types, util, joy */

// run this script with:
// yarn script exportDataDirectory
//
// or copy and paste the code into the pioneer javascript toolbox at:
// https://testnet.joystream.org/#/js

const script = async ({ api }) => {
  const ids = await api.query.dataDirectory.knownContentIds()

  // When a BTreeMap is constructed for injection the node will fail to decode
  // it if its not sorted.
  ids.sort()

  const transformed = await Promise.all(
    ids.map(async (id) => {
      let obj = await api.query.dataDirectory.dataByContentId(id)
      if (obj.isNone) {
        return null
      }
      obj = obj.unwrap()

      return [
        id,
        {
          owner: obj.owner,
          added_at: obj.added_at,
          type_id: obj.type_id,
          size: obj.size_in_bytes,
          liaison: obj.liaison,
          liaison_judgement: obj.liaison_judgement,
          ipfs_content_id: obj.ipfs_content_id,
        },
      ]
    })
  )

  console.log(JSON.stringify(transformed))
  console.error(`Exported ${transformed.length} objects`)
}

if (typeof module === 'undefined') {
  // Pioneer js-toolbox
  script({ api, hashing, keyring, types, util, joy })
} else {
  // Node
  module.exports = script
}
