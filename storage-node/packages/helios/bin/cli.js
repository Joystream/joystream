#!/usr/bin/env node

const { RuntimeApi } = require('@joystream/storage-runtime-api')
const { encodeAddress } = require('@polkadot/keyring')
const axios = require('axios')
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')

function makeAssetUrl(contentId, source) {
  source = stripEndingSlash(source)
  return `${source}/asset/v0/${encodeAddress(contentId)}`
}

async function assetRelationshipState(api, contentId, providers) {
  const dataObject = await api.query.dataDirectory.dataByContentId(contentId)

  const relationshipIds = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId)

  // how many relationships associated with active providers and in ready state
  const activeRelationships = await Promise.all(
    relationshipIds.map(async (id) => {
      let relationship = await api.query.dataObjectStorageRegistry.relationships(id)
      relationship = relationship.unwrap()
      // only interested in ready relationships
      if (!relationship.ready) {
        return undefined
      }
      // Does the relationship belong to an active provider ?
      return providers.find((provider) => relationship.storage_provider.eq(provider))
    })
  )

  return [activeRelationships.filter((active) => active).length, dataObject.liaison_judgement]
}

// HTTP HEAD with axios all known content ids on each provider
async function countContentAvailability(contentIds, source) {
  const content = {}
  let found = 0
  let missing = 0
  for (let i = 0; i < contentIds.length; i++) {
    const assetUrl = makeAssetUrl(contentIds[i], source)
    try {
      const info = await axios.head(assetUrl)
      content[encodeAddress(contentIds[i])] = {
        type: info.headers['content-type'],
        bytes: info.headers['content-length'],
      }
      // TODO: cross check against dataobject size
      found++
    } catch (err) {
      missing++
    }
  }

  return { found, missing, content }
}

async function main() {
  const runtime = await RuntimeApi.create()
  const { api } = runtime

  // get all providers
  const { ids: storageProviders } = await runtime.workers.getAllProviders()
  console.log(`Found ${storageProviders.length} staked providers`)

  // Resolve Endpoints of providers
  console.log('\nResolving live provider API Endpoints...')
  const endpoints = await Promise.all(
    storageProviders.map(async (providerId) => {
      try {
        const endpoint = (await runtime.workers.getWorkerStorageValue(providerId)).toString()
        return { providerId, endpoint }
      } catch (err) {
        console.log('resolve failed for id', providerId, err.message)
        return { providerId, endpoint: null }
      }
    })
  )

  console.log('\nChecking API Endpoints are online')
  await Promise.all(
    endpoints.map(async (provider) => {
      if (!provider.endpoint) {
        console.log(provider.providerId, 'No url set, skipping')
        return
      }
      const swaggerUrl = `${stripEndingSlash(provider.endpoint)}/swagger.json`
      let error
      try {
        await axios.get(swaggerUrl)
        // maybe print out api version information to detect which version of colossus is running?
        // or add anothe api endpoint for diagnostics information
      } catch (err) {
        error = err
      }
      console.log(`${provider.providerId}`, `${provider.endpoint} - ${error ? error.message : 'OK'}`)
    })
  )

  const knownContentIds = await runtime.assets.getKnownContentIds()
  const assetStatuses = {}
  await Promise.all(
    knownContentIds.map(async (contentId) => {
      const [, judgement] = await assetRelationshipState(api, contentId, storageProviders)
      const j = judgement.toString()
      assetStatuses[j] = assetStatuses[j] ? assetStatuses[j] + 1 : 1
    })
  )
  console.log(`\nData Directory has ${knownContentIds.length} assets:`, assetStatuses)

  // interesting disconnect doesn't work unless an explicit provider was created
  // for underlying api instance
  // We no longer need a connection to the chain
  api.disconnect()

  console.log(`\nChecking available assets on providers (this can take some time)...`)
  endpoints.forEach(async ({ providerId, endpoint }) => {
    if (!endpoint) {
      return
    }
    const total = knownContentIds.length
    const { found } = await countContentAvailability(knownContentIds, endpoint)
    console.log(`provider ${providerId}: has ${found} out of ${total}`)
  })
}

main()
