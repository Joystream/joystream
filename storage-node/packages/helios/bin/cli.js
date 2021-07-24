#!/usr/bin/env node

const { RuntimeApi } = require('@joystream/storage-runtime-api')
const { encodeAddress } = require('@polkadot/keyring')
const axios = require('axios')
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')

function makeAssetUrl(contentId, source) {
  source = stripEndingSlash(source)
  return `${source}/asset/v0/${encodeAddress(contentId)}`
}

// HTTP HEAD with axios all known content ids on each provider
async function countContentAvailability(contentIds, source) {
  let found = 0
  let errored = 0

  // TODO: To avoid opening too many connections do it in chunks.. otherwise were are getting
  // Error: Client network socket disconnected before secure TLS connection was established
  contentIds = contentIds.slice(0, 200)

  // use axios.all() instead ?
  const results = await Promise.allSettled(contentIds.map((id) => axios.head(makeAssetUrl(id, source))))

  results.forEach((result, _ix) => {
    if (result.status === 'rejected') {
      errored++
    } else {
      found++
    }
  })

  return { found, errored }
}

async function testProviderHasAssets(providerId, endpoint, contentIds) {
  const total = contentIds.length
  const { found, errored } = await countContentAvailability(contentIds, endpoint)
  console.log(`provider ${providerId}: has ${errored} errored assets`)
  console.log(`provider ${providerId}: has ${found} out of ${total}`)
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

  const allContentIds = await runtime.assets.getKnownContentIds()
  const acceptedContentIds = await runtime.assets.getAcceptedContentIds()

  console.log(`\nData Directory has ${acceptedContentIds.length} 'Accepted' objects out of ${allContentIds.length}`)

  // interesting disconnect doesn't work unless an explicit provider was created
  // for underlying api instance
  // We no longer need a connection to the chain
  api.disconnect()

  console.log(`\nChecking available assets on providers (this can take some time)...`)

  // TODO: Do it sequentially one provider at a time.. to control connections/s to avoid
  // connection resets?
  endpoints.forEach(async ({ providerId, endpoint }) => {
    if (!endpoint) {
      return
    }
    return testProviderHasAssets(providerId, endpoint, acceptedContentIds)
  })
}

main()
