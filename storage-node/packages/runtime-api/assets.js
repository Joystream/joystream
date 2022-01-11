'use strict'

const debug = require('debug')('joystream:runtime:assets')
const { decodeAddress } = require('@polkadot/keyring')
const { StorageObjectOwner, DataObject } = require('@joystream/types/storage')

function parseContentId(contentId) {
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
  static async create(base) {
    const ret = new AssetsApi()
    ret.base = base
    await AssetsApi.init()
    return ret
  }

  static async init() {
    debug('Init')
  }

  /*
   * Create and return a data object.
   */
  async createDataObject(accountId, memberId, contentId, doTypeId, size, ipfsCid) {
    contentId = parseContentId(contentId)
    const owner = {
      Member: memberId,
    }
    const content = [
      {
        content_id: contentId,
        type_id: doTypeId,
        size,
        ipfs_content_id: ipfsCid,
      },
    ]
    const tx = this.base.api.tx.dataDirectory.addContent(owner, content)
    await this.base.signAndSend(accountId, tx)

    // If the data object constructed properly, we should now be able to return
    // the data object from the state.
    return this.getDataObject(contentId)
  }

  /*
   * Returns the Data Object for a contendId.
   * Returns null if it doesn't exist.
   */
  async getDataObject(contentId) {
    contentId = parseContentId(contentId)
    // check if contentId key exists in map
    const storageSize = await this.base.api.query.dataDirectory.dataByContentId.size(contentId)
    if (storageSize.eq(0)) {
      return null
    }
    return this.base.api.query.dataDirectory.dataByContentId(contentId)
  }

  /*
   * Verify the liaison state for a DataObject:
   * - Check the content ID has a DataObject
   * - Check the storageProviderId is the liaison
   * - Check the liaison state is Pending
   *
   * Each failure errors out, success returns the data object.
   */
  async checkLiaisonForDataObject(storageProviderId, contentId) {
    contentId = parseContentId(contentId)

    const obj = await this.getDataObject(contentId)

    if (!obj) {
      throw new Error(`No DataObject found for content ID: ${contentId}`)
    }

    if (!obj.liaison.eq(storageProviderId)) {
      throw new Error(`This storage node is not liaison for the content ID: ${contentId}`)
    }

    if (obj.liaison_judgement.type !== 'Pending') {
      throw new Error(`Content upload has already been processed.`)
    }

    return obj
  }

  /*
   * Sets the data object liaison judgement to Accepted
   */
  async acceptContent(providerAccoundId, storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataDirectory.acceptContent(storageProviderId, contentId)
    return this.base.signAndSend(providerAccoundId, tx)
  }

  /*
   * Gets storage relationship for contentId for the given provider
   */
  async getStorageRelationshipAndId(storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    const rids = await this.base.api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId)

    while (rids.length) {
      const relationshipId = rids.shift()
      let relationship = await this.base.api.query.dataObjectStorageRegistry.relationships(relationshipId)
      relationship = relationship.unwrap()
      if (relationship.storage_provider.eq(storageProviderId)) {
        return { relationship, relationshipId }
      }
    }

    return {}
  }

  /*
   * Creates storage relationship for a data object and provider and
   * returns the relationship id
   */
  async createStorageRelationship(providerAccountId, storageProviderId, contentId) {
    contentId = parseContentId(contentId)
    const tx = this.base.api.tx.dataObjectStorageRegistry.addRelationship(storageProviderId, contentId)

    return this.base.signAndSendThenGetEventResult(providerAccountId, tx, {
      module: 'dataObjectStorageRegistry',
      event: 'DataObjectStorageRelationshipAdded',
      type: 'DataObjectStorageRelationshipId',
      index: 0,
    })
  }

  /*
   * Set the ready state for a data object storage relationship to the new value
   */
  async toggleStorageRelationshipReady(providerAccountId, storageProviderId, dosrId, ready) {
    const tx = ready
      ? this.base.api.tx.dataObjectStorageRegistry.setRelationshipReady(storageProviderId, dosrId)
      : this.base.api.tx.dataObjectStorageRegistry.unsetRelationshipReady(storageProviderId, dosrId)
    return this.base.signAndSend(providerAccountId, tx)
  }

  /*
   * Returns array of all the content ids in storage
   */
  async getKnownContentIds() {
    const keys = await this.base.api.query.dataDirectory.dataByContentId.keys()
    return keys.map(({ args: [contentId] }) => contentId)
  }

  /*
   * Returns array of all content ids in storage where liaison judgement was Accepted
   */
  async getAcceptedContentIds() {
    const entries = await this.base.api.query.dataDirectory.dataByContentId.entries()
    return entries
      .filter(([, dataObject]) => dataObject.liaison_judgement.type === 'Accepted')
      .map(
        ([
          {
            args: [contentId],
          },
        ]) => contentId
      )
  }
}

module.exports = {
  AssetsApi,
}
