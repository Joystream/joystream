'use strict'

const debug = require('debug')('joystream:runtime:assets')
const { decodeAddress } = require('@polkadot/keyring')

function parseContentId (contentId) {
  try {
    return decodeAddress(contentId)
  } catch (err) {
    return contentId
  }
}

/*
 * Add asset related functionality to the substrate API.
 */
class AssetsApi {
  static async create (base) {
    const ret = new AssetsApi()
    ret.base = base
    await ret.init()
    return ret
  }

  async init () {
    debug('Init')
  }

  /*
   * Create a data object.
   */
  async createDataObject (accountId, memberId, contentId, doTypeId, size, ipfsCid) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataDirectory.addContent(memberId, contentId, doTypeId, size, ipfsCid)
    await this.base.signAndSend(accountId, tx)

    // If the data object constructed properly, we should now be able to return
    // the data object from the state.
    return this.getDataObject(contentId)
  }

  /*
   * Return the Data Object for a CID
   */
  async getDataObject (contentId) {
    contentId = parseContentId(contentId)
    return this.base.api.query.dataDirectory.dataObjectByContentId(contentId)
  }

  /*
   * Verify the liaison state for a DO:
   * - Check the content ID has a DO
   * - Check the storageProviderId is the liaison
   * - Check the liaison state is pending
   *
   * Each failure errors out, success returns the data object.
   */
  async checkLiaisonForDataObject (storageProviderId, contentId) {
    contentId = parseContentId(contentId)

    let obj = await this.getDataObject(contentId)

    if (obj.isNone) {
      throw new Error(`No DataObject created for content ID: ${contentId}`)
    }

    obj = obj.unwrap()

    if (!obj.liaison.eq(storageProviderId)) {
      throw new Error(`This storage node is not liaison for the content ID: ${contentId}`)
    }

    if (obj.liaison_judgement.type !== 'Pending') {
      throw new Error(`Expected Pending judgement, but found: ${obj.liaison_judgement.type}`)
    }

    return obj
  }

  /*
   * Changes a data object liaison judgement.
   */
  async acceptContent (providerAccoundId, storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataDirectory.acceptContent(storageProviderId, contentId)
    return this.base.signAndSend(providerAccoundId, tx)
  }

  /*
   * Changes a data object liaison judgement.
   */
  async rejectContent (providerAccountId, storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataDirectory.rejectContent(storageProviderId, contentId)
    return this.base.signAndSend(providerAccountId, tx)
  }

  /*
   * Create storage relationship
   */
  async createStorageRelationship (providerAccountId, storageProviderId, contentId, callback) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataObjectStorageRegistry.addRelationship(storageProviderId, contentId)

    const subscribed = [['dataObjectStorageRegistry', 'DataObjectStorageRelationshipAdded']]
    return this.base.signAndSend(providerAccountId, tx, 3, subscribed, callback)
  }

  /*
   * Get storage relationship for contentId
   */
  async getStorageRelationshipAndId (storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    let rids = await this.base.api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId)

    while (rids.length) {
      const relationshipId = rids.shift()
      let relationship = await this.base.api.query.dataObjectStorageRegistry.relationships(relationshipId)
      relationship = relationship.unwrap()
      if (relationship.storage_provider.eq(storageProviderId)) {
        return ({ relationship, relationshipId })
      }
    }

    return {}
  }

  async createAndReturnStorageRelationship (providerAccountId, storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    return new Promise(async (resolve, reject) => {
      try {
        await this.createStorageRelationship(providerAccountId, storageProviderId, contentId, (events) => {
          events.forEach((event) => {
            resolve(event[1].DataObjectStorageRelationshipId)
          })
        })
      } catch (err) {
        reject(err)
      }
    })
  }

  /*
   * Toggle ready state for DOSR.
   */
  async toggleStorageRelationshipReady (providerAccountId, storageProviderId, dosrId, ready) {
    var tx = ready
      ? this.base.api.tx.dataObjectStorageRegistry.setRelationshipReady(storageProviderId, dosrId)
      : this.base.api.tx.dataObjectStorageRegistry.unsetRelationshipReady(storageProviderId, dosrId)
    return this.base.signAndSend(providerAccountId, tx)
  }

  async getKnownContentIds () {
    return this.base.api.query.dataDirectory.knownContentIds()
  }
}

module.exports = {
  AssetsApi
}
