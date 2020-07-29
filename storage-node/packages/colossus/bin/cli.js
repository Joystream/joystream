#!/usr/bin/env node
/* es-lint disable*/

'use strict'

// Node requires
const path = require('path')

// npm requires
const meow = require('meow')
const chalk = require('chalk')
const figlet = require('figlet')
const _ = require('lodash')

const debug = require('debug')('joystream:colossus')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '..')

// Number of milliseconds to wait between synchronization runs.
const SYNC_PERIOD_MS = 300000 // 5min

// Parse CLI
const FLAG_DEFINITIONS = {
  port: {
    type: 'number',
    alias: 'p',
    default: 3000,
  },
  keyFile: {
    type: 'string',
    isRequired: (flags, input) => {
      // Only required if running server command and not in dev mode
      const serverCmd = input[0] === 'server'
      return !flags.dev && serverCmd
    },
  },
  publicUrl: {
    type: 'string',
    alias: 'u',
    isRequired: (flags, input) => {
      // Only required if running server command and not in dev mode
      const serverCmd = input[0] === 'server'
      return !flags.dev && serverCmd
    },
  },
  passphrase: {
    type: 'string',
  },
  wsProvider: {
    type: 'string',
    default: 'ws://localhost:9944',
  },
  providerId: {
    type: 'number',
    alias: 'i',
    isRequired: (flags, input) => {
      // Only required if running server command and not in dev mode
      const serverCmd = input[0] === 'server'
      return !flags.dev && serverCmd
    },
  },
}

const cli = meow(
  `
  Usage:
    $ colossus [command] [arguments]

  Commands:
    server        Runs a production server instance. (discovery and storage services)
                  This is the default command if not specified.
    discovery     Run the discovery service only.

  Arguments (required for server. Ignored if running server with --dev option):
    --provider-id ID, -i ID     StorageProviderId assigned to you in working group.
    --key-file FILE             JSON key export file to use as the storage provider (role account).
    --public-url=URL, -u URL    API Public URL to announce.

  Arguments (optional):
    --dev                   Runs server with developer settings.
    --passphrase            Optional passphrase to use to decrypt the key-file.
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --ws-provider WS_URL    Joystream-node websocket provider, defaults to ws://localhost:9944
  `,
  { flags: FLAG_DEFINITIONS }
)

// All-important banner!
function banner() {
  console.log(chalk.blue(figlet.textSync('joystream', 'Speed')))
}

function startExpressApp(app, port) {
  const http = require('http')
  const server = http.createServer(app)

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.on('close', (...args) => {
      console.log('Server closed, shutting down...')
      resolve(...args)
    })
    server.on('listening', () => {
      console.log('API server started.', server.address())
    })
    server.listen(port, '::')
    console.log('Starting API server...')
  })
}

// Start app
function startAllServices({ store, api, port }) {
  const app = require('../lib/app')(PROJECT_ROOT, store, api)
  return startExpressApp(app, port)
}

// Start discovery service app only
function startDiscoveryService({ api, port }) {
  const app = require('../lib/discovery')(PROJECT_ROOT, api)
  return startExpressApp(app, port)
}

// Get an initialized storage instance
function getStorage(runtimeApi) {
  // TODO at some point, we can figure out what backend-specific connection
  // options make sense. For now, just don't use any configuration.
  const { Storage } = require('@joystream/storage-node-backend')

  const options = {
    resolve_content_id: async (contentId) => {
      // Resolve via API
      const obj = await runtimeApi.assets.getDataObject(contentId)
      if (!obj || obj.isNone) {
        return
      }
      // if obj.liaison_judgement !== Accepted .. throw ?
      return obj.unwrap().ipfs_content_id.toString()
    },
  }

  return Storage.create(options)
}

async function initApiProduction({ wsProvider, providerId, keyFile, passphrase }) {
  // Load key information
  const { RuntimeApi } = require('@joystream/storage-runtime-api')

  if (!keyFile) {
    throw new Error('Must specify a --key-file argument for running a storage node.')
  }

  if (providerId === undefined) {
    throw new Error('Must specify a --provider-id argument for running a storage node')
  }

  const api = await RuntimeApi.create({
    account_file: keyFile,
    passphrase,
    provider_url: wsProvider,
    storageProviderId: providerId,
  })

  if (!api.identities.key) {
    throw new Error('Failed to unlock storage provider account')
  }

  await api.untilChainIsSynced()

  if (!(await api.workers.isRoleAccountOfStorageProvider(api.storageProviderId, api.identities.key.address))) {
    throw new Error('storage provider role account and storageProviderId are not associated with a worker')
  }

  return api
}

async function initApiDevelopment() {
  // Load key information
  const { RuntimeApi } = require('@joystream/storage-runtime-api')

  const wsProvider = 'ws://localhost:9944'

  const api = await RuntimeApi.create({
    provider_url: wsProvider,
  })

  const dev = require('../../cli/dist/commands/dev')

  api.identities.useKeyPair(dev.roleKeyPair(api))

  api.storageProviderId = await dev.check(api)

  return api
}

function getServiceInformation(publicUrl) {
  // For now assume we run all services on the same endpoint
  return {
    asset: {
      version: 1, // spec version
      endpoint: publicUrl,
    },
    discover: {
      version: 1, // spec version
      endpoint: publicUrl,
    },
  }
}

// TODO: instead of recursion use while/async-await and use promise/setTimout based sleep
// or cleaner code with generators?
async function announcePublicUrl(api, publicUrl) {
  // re-announce in future
  const reannounce = function (timeoutMs) {
    setTimeout(announcePublicUrl, timeoutMs, api, publicUrl)
  }

  const chainIsSyncing = await api.chainIsSyncing()
  if (chainIsSyncing) {
    debug('Chain is syncing. Postponing announcing public url.')
    return reannounce(10 * 60 * 1000)
  }

  const sufficientBalance = await api.providerHasMinimumBalance(1)
  if (!sufficientBalance) {
    debug('Provider role account does not have sufficient balance. Postponing announcing public url.')
    return reannounce(10 * 60 * 1000)
  }

  debug('announcing public url')
  const { publish } = require('@joystream/service-discovery')

  try {
    const serviceInformation = getServiceInformation(publicUrl)

    const keyId = await publish.publish(serviceInformation)

    await api.discovery.setAccountInfo(keyId)

    debug('publishing complete, scheduling next update')

    // >> sometimes after tx is finalized.. we are not reaching here!

    // Reannounce before expiery. Here we are concerned primarily
    // with keeping the account information refreshed and 'available' in
    // the ipfs network. our record on chain is valid for 24hr
    reannounce(50 * 60 * 1000) // in 50 minutes
  } catch (err) {
    debug(`announcing public url failed: ${err.stack}`)

    // On failure retry sooner
    debug(`announcing failed, retrying in: 2 minutes`)
    reannounce(120 * 1000)
  }
}

// Simple CLI commands
let command = cli.input[0]
if (!command) {
  command = 'server'
}

async function startColossus({ api, publicUrl, port }) {
  // TODO: check valid url, and valid port number
  const store = getStorage(api)
  banner()
  const { startSyncing } = require('../lib/sync')
  startSyncing(api, { syncPeriod: SYNC_PERIOD_MS }, store)
  announcePublicUrl(api, publicUrl)
  return startAllServices({ store, api, port })
}

const commands = {
  server: async () => {
    let publicUrl, port, api

    if (cli.flags.dev) {
      const dev = require('../../cli/dist/commands/dev')
      api = await initApiDevelopment()
      port = dev.developmentPort()
      publicUrl = `http://localhost:${port}/`
    } else {
      api = await initApiProduction(cli.flags)
      publicUrl = cli.flags.publicUrl
      port = cli.flags.port
    }

    return startColossus({ api, publicUrl, port })
  },
  discovery: async () => {
    banner()
    debug('Starting Joystream Discovery Service')
    const { RuntimeApi } = require('@joystream/storage-runtime-api')
    const wsProvider = cli.flags.wsProvider
    const api = await RuntimeApi.create({ provider_url: wsProvider })
    const port = cli.flags.port
    await api.untilChainIsSynced()
    await startDiscoveryService({ api, port })
  },
}

async function main() {
  // Simple CLI commands
  let command = cli.input[0]
  if (!command) {
    command = 'server'
  }

  if (Object.prototype.hasOwnProperty.call(commands, command)) {
    // Command recognized
    const args = _.clone(cli.input).slice(1)
    await commands[command](...args)
  } else {
    throw new Error(`Command '${command}' not recognized, aborting!`)
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(chalk.red(err.stack))
    process.exit(-1)
  })
