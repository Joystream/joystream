#!/usr/bin/env node

const { RuntimeApi } = require('@joystream/storage-runtime-api')
const { encodeAddress } = require('@polkadot/keyring')
const axios = require('axios')
const stripEndingSlash = require('@joystream/storage-utils/stripEndingSlash')
const cliProgress = require('cli-progress')
const meow = require('meow')
const _ = require('lodash')
const fs = require('fs')

const debug = console.error.bind(console)

function makeAssetUrl(contentId, source) {
  source = stripEndingSlash(source)
  return `${source}/asset/v0/${contentId}`
}

// HTTP HEAD with axios all known content ids on given endpoint
async function countContentAvailability(providerId, endpoint, contentIds, multibar) {
  let found = 0
  // Array of content ids which failed to be fetched
  const failed = []
  let failures = 0
  let requestsSent = 0
  let notFound = 0
  let internalError = 0

  const progressBar = multibar.create(
    {
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_classic
  )
  progressBar.start(contentIds.length, 0)

  // Avoid opening too many connections, do it in chunks.. otherwise we get
  // "Client network socket disconnected before secure TLS connection was established" errors
  while (contentIds.length) {
    const ids = contentIds.splice(0, 100)
    requestsSent += ids.length
    progressBar.update(requestsSent, { providerId, failures })
    const results = await Promise.allSettled(ids.map((id) => axios.head(makeAssetUrl(id, endpoint))))

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        try {
          const statusCode = result.reason.response.status
          if (statusCode >= 400 && statusCode < 500) {
            notFound++
          }
          if (statusCode >= 500 && statusCode < 600) {
            internalError++
          }
        } catch (_err) {
          // couldn't get failure status code
        }
        failed.push(ids[i])
        failures++
      } else {
        found++
      }
    })
  }

  progressBar.stop()
  return { found, failed, failures, notFound, internalError }
}

async function testProviderHasAssets(providerId, endpoint, contentIds, multibar) {
  const total = contentIds.length
  const startedAt = Date.now()
  const { found, failed, failures, notFound, internalError } = await countContentAvailability(
    providerId,
    endpoint,
    contentIds,
    multibar
  )
  const completedAt = Date.now()
  return {
    summary: {
      providerId,
      publicUrl: endpoint,
      checked: total,
      found,
      successRate: (found / total) * 100,
      failures,
      notFound,
      internalError,
      duration: (completedAt - startedAt) / 1000,
    },
    failed,
  }
}

async function fetchProviders() {
  debug('Connecting to chain')
  const runtime = await RuntimeApi.create()
  const { api } = runtime

  debug('Fetching providers')
  const { ids: storageProviders } = await runtime.workers.getAllProviders()
  debug(`Found ${storageProviders.length} staked providers`)

  // Resolve Endpoints of providers
  debug('Resolving Provider API Endpoints')
  const providers = await Promise.all(
    storageProviders.map(async (providerId) => {
      try {
        const endpoint = (await runtime.workers.getWorkerStorageValue(providerId)).toString()
        if (!endpoint) {
          debug(`${providerId}:`, 'Empty public Url')
        }
        return { providerId, endpoint }
      } catch (err) {
        debug('Resolve failed for id', providerId, err.message)
        return { providerId, endpoint: null }
      }
    })
  )

  // We no longer need a connection to the chain
  await api.disconnect()

  return providers
}

async function testEndpoints(providers) {
  debug('Testing Provider API Endpoints')
  return Promise.all(
    providers.map(async (provider) => {
      if (!provider.endpoint) {
        return {
          ...provider,
          status: 'no url set',
          version: '',
        }
      }
      const swaggerUrl = `${stripEndingSlash(provider.endpoint)}/swagger.json`
      try {
        const { data } = await axios.get(swaggerUrl)
        debug(`${provider.providerId}:`, `${provider.endpoint}`, '- OK -', `API version ${data.info.version}`)
        return {
          ...provider,
          status: 'OK',
          version: data.info.node_version,
        }
      } catch (err) {
        debug(`${provider.providerId}:`, `${provider.endpoint}`, '- FAILED -', `${err.message}`)
        return {
          ...provider,
          status: err.message,
          version: '',
        }
      }
    })
  )
}

async function fetchContentIds() {
  debug('Connecting to chain')
  const runtime = await RuntimeApi.create()
  const { api } = runtime

  debug('Fetching Data Directory objects')
  await runtime.assets.fetchDataObjects()
  debug('Fetched')

  const allContentIds = await runtime.assets.getKnownContentIds()
  debug(allContentIds.length, 'created')

  const acceptedContentIds = runtime.assets.getAcceptedContentIds()
  debug(acceptedContentIds.length, 'accepted')

  const ipfsHashes = runtime.assets.getAcceptedIpfsHashes()
  debug(ipfsHashes.length, 'unique accepted hashes')

  await api.disconnect()

  return acceptedContentIds
}

async function main() {
  const cli = meow(`
  Helios - Storage Node diagnostics

  Usage:
    $ helios [arguments]

  Arguments (optional)
    --endpoint URL            Test only one specific colossus API endpoint (does not have to be an active worker).
                              When not specified all online storage providers will be tested.
    --skip-asset-tests        If set, providers will not be checked for asset availability.
    --limit-assets  N         Limit checks to N assets.
    --assets                  Path to a JSON file containing array of ContentIds to test.
                              When not specified all 'Accepted' content will be tested.
    --dump-assets             Dumps list of assets (content ids) which will be tested.
    --detailed                Includes list of failed assets in output report.
`)

  const finalReport = {}

  let providers = []

  if (cli.flags.endpoint) {
    providers.push({
      endpoint: cli.flags.endpoint,
      providerId: null,
    })
  } else {
    providers = await fetchProviders()
  }

  finalReport.providers = await testEndpoints(providers)

  let contentIds

  if (cli.flags.skipAssetTests) {
    contentIds = []
  } else {
    if (cli.flags.assets) {
      // Load data objects from chain or from a file
      const file = cli.flags.assets
      contentIds = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }))
    } else {
      contentIds = await fetchContentIds()
    }
  }

  // limit number of assets to test ?
  const limit = cli.flags.limitAssets
  let contentToTest
  if (limit) {
    contentToTest = contentIds.slice(0, limit)
  } else {
    contentToTest = contentIds
  }

  contentToTest = contentToTest.map((id) => encodeAddress(id))

  if (cli.flags.dumpAssets) {
    debug('Testing Assets:')
    debug(JSON.stringify(contentToTest, null, '  '))
  }

  const multibar = new cliProgress.MultiBar(
    {
      clearOnComplete: true,
      hideCursor: true,
      autopadding: true,
      forceRedraw: true,
      fps: 5,
      format: '- {bar} | {percentage}% | ETA: {eta}s | {value}/{total} | Failures: {failures} | Id: {providerId}',
    },
    cliProgress.Presets.shades_grey
  )

  let stats = []

  if (cli.flags.endpoint) {
    const endpoint = cli.flags.endpoint
    debug('Checking available assets on', endpoint)
    stats = [await testProviderHasAssets(null, endpoint, contentToTest, multibar)]
  } else {
    debug('Checking available assets on live providers')
    stats = (
      await Promise.all(
        providers.map(async ({ providerId, endpoint }) => {
          if (!endpoint) {
            return null
          }
          return testProviderHasAssets(providerId, endpoint, contentToTest.slice(), multibar)
        })
      )
    ).filter((report) => report !== null)
  }

  multibar.stop()

  if (cli.flags.detailed) {
    finalReport.stats = stats
  } else {
    finalReport.stats = stats.map((report) => report.summary)
  }

  // Assets that appear to be missing on all providers
  if (cli.flags.detailed) {
    finalReport.commonFailed = _.intersection(...stats.map((report) => report.failed))
  }

  console.log(JSON.stringify(finalReport, null, '  '))
}

main()
