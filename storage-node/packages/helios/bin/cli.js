#!/usr/bin/env node

const { RuntimeApi } = require('@joystream/storage-runtime-api')
const { encodeAddress } = require('@polkadot/keyring')
const axios = require('axios')
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')

function makeAssetUrl(contentId, source) {
  source = stripEndingSlash(source)
  return `${source}/asset/v0/${encodeAddress(contentId)}`
}

// HTTP HEAD with axios all known content ids on given endpoint
async function countContentAvailability(contentIds, endpoint) {
  let found = 0
  let errored = 0
  let requestsSent = 0
  // Avoid opening too many connections, do it in chunks.. otherwise we get
  // "Client network socket disconnected before secure TLS connection was established" errors
  while (contentIds.length) {
    const chunk = contentIds.splice(0, 500)
    requestsSent += chunk.length
    const results = await Promise.allSettled(chunk.map((id) => axios.head(makeAssetUrl(id, endpoint))))

    results.forEach((result, _ix) => {
      if (result.status === 'rejected') {
        errored++
      } else {
        found++
      }
    })

    // show some progress
    console.error(`${endpoint}:`, `total requests sent: ${requestsSent}`, `found: ${found}`, `failed: ${errored}`)
  }

  return { found, errored }
}

async function testProviderHasAssets(providerId, endpoint, contentIds) {
  const total = contentIds.length
  const startedAt = Date.now()
  const { found, errored } = await countContentAvailability(contentIds, endpoint)
  const completedAt = Date.now()
  console.log(`
    Final Result for provider ${providerId}
    fetched: ${found}/${total}
    failed: ${errored}
    took: ${(completedAt - startedAt) / 1000}s
  `)
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
      try {
        const { data } = await axios.get(swaggerUrl)
        console.log(
          `${provider.providerId}:`,
          `${provider.endpoint}`,
          '- OK -',
          `storage node version ${data.info.version}`
        )
      } catch (err) {
        console.log(`${provider.providerId}`, `${provider.endpoint} - ${err.message}`)
      }
    })
  )

  const allContentIds = await runtime.assets.getKnownContentIds()
  const acceptedContentIds = await runtime.assets.getAcceptedContentIds()

  console.log(`\nData Directory has ${acceptedContentIds.length} 'Accepted' objects out of ${allContentIds.length}`)

  // We no longer need a connection to the chain
  api.disconnect()

  console.log(`
    Checking available assets on providers (this can take some time)
    This is done by sending HEAD requests for all 'Accepted' assets.
  `)

  endpoints.forEach(async ({ providerId, endpoint }) => {
    if (!endpoint) {
      return
    }
    return testProviderHasAssets(providerId, endpoint, acceptedContentIds.slice())
  })
}

main()
