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
    default: 3000
  },
  keyFile: {
    type: 'string',
    isRequired: (flags, input) => {
      return !flags.dev
    }
  },
  publicUrl: {
    type: 'string',
    alias: 'u',
    isRequired: (flags, input) => {
      return !flags.dev
    }
  },
  passphrase: {
    type: 'string'
  },
  wsProvider: {
    type: 'string',
    default: 'ws://localhost:9944'
  },
  providerId: {
    type: 'number',
    alias: 'i',
    isRequired: (flags, input) => {
      return !flags.dev
    }
  }
}

const cli = meow(`
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
  { flags: FLAG_DEFINITIONS })

// All-important banner!
function banner () {
  console.log(chalk.blue(figlet.textSync('joystream', 'Speed')))
}

function start_express_app(app, port) {
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
function start_all_services ({ store, api, port }) {
  const app = require('../lib/app')(PROJECT_ROOT, store, api) // reduce falgs to only needed values
  return start_express_app(app, port)
}

// Start discovery service app only
function start_discovery_service ({ api, port }) {
  const app = require('../lib/discovery')(PROJECT_ROOT, api) // reduce flags to only needed values
  return start_express_app(app, port)
}

// Get an initialized storage instance
function get_storage (runtime_api) {
  // TODO at some point, we can figure out what backend-specific connection
  // options make sense. For now, just don't use any configuration.
  const { Storage } = require('@joystream/storage')

  const options = {
    resolve_content_id: async (content_id) => {
      // Resolve via API
      const obj = await runtime_api.assets.getDataObject(content_id)
      if (!obj || obj.isNone) {
        return
      }
      // if obj.liaison_judgement !== Accepted .. throw ?
      return obj.unwrap().ipfs_content_id.toString()
    }
  }

  return Storage.create(options)
}

async function init_api_production ({ wsProvider, providerId, keyFile, passphrase }) {
  // Load key information
  const { RuntimeApi } = require('@joystream/runtime-api')

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
    storageProviderId: providerId
  })

  if (!api.identities.key) {
    throw new Error('Failed to unlock storage provider account')
  }

  if (!await api.workers.isRoleAccountOfStorageProvider(api.storageProviderId, api.identities.key.address)) {
    throw new Error('storage provider role account and storageProviderId are not associated with a worker')
  }

  return api
}

async function init_api_development () {
  // Load key information
  const { RuntimeApi } = require('@joystream/runtime-api')

  const wsProvider = 'ws://localhost:9944'

  const api = await RuntimeApi.create({
    provider_url: wsProvider
  })

  const dev = require('../../cli/bin/dev')

  api.identities.useKeyPair(dev.roleKeyPair(api))

  api.storageProviderId = await dev.check(api)

  return api
}

function get_service_information (publicUrl) {
  // For now assume we run all services on the same endpoint
  return({
    asset: {
      version: 1, // spec version
      endpoint: publicUrl
    },
    discover: {
      version: 1, // spec version
      endpoint: publicUrl
    }
  })
}

async function announce_public_url (api, publicUrl) {
  // re-announce in future
  const reannounce = function (timeoutMs) {
    setTimeout(announce_public_url, timeoutMs, api, publicUrl)
  }

  debug('announcing public url')
  const { publish } = require('@joystream/discovery')

  try {
    const serviceInformation = get_service_information(publicUrl)

    let keyId = await publish.publish(serviceInformation)

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

function go_offline (api) {
  return api.discovery.unsetAccountInfo()
}

// Simple CLI commands
var command = cli.input[0]
if (!command) {
  command = 'server'
}

async function start_colossus ({ api, publicUrl, port, flags }) {
  // TODO: check valid url, and valid port number
  const store = get_storage(api)
  banner()
  const { start_syncing } = require('../lib/sync')
  start_syncing(api, { syncPeriod: SYNC_PERIOD_MS }, store)
  announce_public_url(api, publicUrl)
  return start_all_services({ store, api, port, flags }) // dont pass all flags only required values
}

const commands = {
  'server': async () => {
    let publicUrl, port, api

    if (cli.flags.dev) {
      const dev = require('../../cli/bin/dev')
      api = await init_api_development()
      port = dev.developmentPort()
      publicUrl = `http://localhost:${port}/`
    } else {
      api = await init_api_production(cli.flags)
      publicUrl = cli.flags.publicUrl
      port = cli.flags.port
    }

    return start_colossus({ api, publicUrl, port })
  },
  'discovery': async () => {
    debug('Starting Joystream Discovery Service')
    const { RuntimeApi } = require('@joystream/runtime-api')
    const wsProvider = cli.flags.wsProvider
    const api = await RuntimeApi.create({ provider_url: wsProvider })
    const port = cli.flags.port
    await start_discovery_service({ api, port })
  }
}

async function main () {
  // Simple CLI commands
  var command = cli.input[0]
  if (!command) {
    command = 'server'
  }

  if (commands.hasOwnProperty(command)) {
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
