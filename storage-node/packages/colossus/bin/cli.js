#!/usr/bin/env node
'use strict'

// Node requires
const path = require('path')

// npm requires
const meow = require('meow')
const chalk = require('chalk')
const figlet = require('figlet')
const _ = require('lodash')

const debug = require('debug')('joystream:cli')

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '..')

// Parse CLI
const FLAG_DEFINITIONS = {
  port: {
    type: 'number',
    alias: 'p',
    default: 3000
  },
  syncPeriod: {
    type: 'number',
    default: 300000
  },
  keyFile: {
    type: 'string'
  },
  publicUrl: {
    type: 'string',
    alias: 'u'
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
    alias: 'i'
  }
}

const cli = meow(`
  Usage:
    $ colossus [command] [arguments]

  Commands:
    server [default]  Run a server instance.
    discovery         Run the discovery service only.
    dev-server        Run a local development server for testing, listens on port 3001

  Arguments (required for server):
    --provider-id ID, -i ID     StorageProviderId assigned to you in working group.
    --key-file FILE             JSON key export file to use as the storage provider (role account).
    --public-url=URL, -u URL    API Public URL to announce.

  Arguments (optional):
    --passphrase            Optional passphrase to use to decrypt the key-file.
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --sync-period           Number of milliseconds to wait between synchronization
                            runs. Defaults to 300000ms (5min).
    --ws-provider WSURL     Joystream Node websocket provider url, eg: 'ws://127.0.0.1:9944'
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
function start_all_services (store, api) {
  const app = require('../lib/app')(PROJECT_ROOT, store, api, cli.flags)
  const port = cli.flags.port
  return start_express_app(app, port)
}

// Start discovery service app
function start_discovery_service (api) {
  const app = require('../lib/discovery')(PROJECT_ROOT, api, cli.flags)
  const port = cli.flags.port
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

      return obj.unwrap().ipfs_content_id.toString()
    }
  }

  return Storage.create(options)
}

async function init_api_as_storage_provider () {
  // Load key information
  const { RuntimeApi } = require('@joystream/runtime-api')
  const keyFile = cli.flags.keyFile
  const providerId = cli.flags.providerId

  if (!keyFile) {
    throw new Error('Must specify a --key-file argument for running a storage node.')
  }

  if (providerId === undefined) {
    throw new Error('Must specify a --provider-id argument for running a storage node')
  }

  const wsProvider = cli.flags.wsProvider

  const api = await RuntimeApi.create({
    account_file: keyFile,
    passphrase: cli.flags.passphrase,
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

async function init_api_as_development_storage_provider () {
  // Load key information
  const { RuntimeApi } = require('@joystream/runtime-api')
  const providerId = 0

  const wsProvider = 'ws://localhost:9944'

  const api = await RuntimeApi.create({
    provider_url: wsProvider,
    storageProviderId: providerId
  })

  const dev = require('../../cli/bin/dev')
  api.identities.useKeyPair(dev.roleKeyPair(api))

  console.log(`Using ${api.identities.key.address} as role account`)

  if (!await api.workers.isRoleAccountOfStorageProvider(api.storageProviderId, api.identities.key.address)) {
    throw new Error('Development chain not configured correctly')
  } else {
    console.log('== Running Development Server ==')
  }

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

    // Reannounce before expiery
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

const commands = {
  'server': async () => {
    // Load key information
    const api = await init_api_as_storage_provider()

    console.log('Storage Provider identity initialized, proceeding.')

    // A public URL is configured
    if (!cli.flags.publicUrl) {
      throw new Error('Must specify a --public-url argument')
    }

    // TODO: check valid url

    // Continue with server setup
    const store = get_storage(api)
    banner()

    const { start_syncing } = require('../lib/sync')
    start_syncing(api, cli.flags, store)

    announce_public_url(api, cli.flags.publicUrl)
    await start_all_services(store, api)
  },
  'down': async () => {
    const api = await init_api_as_storage_provider()
    await go_offline(api)
  },
  'discovery': async () => {
    debug('Starting Joystream Discovery Service')
    const { RuntimeApi } = require('@joystream/runtime-api')
    const wsProvider = cli.flags.wsProvider
    const api = await RuntimeApi.create({ provider_url: wsProvider })
    await start_discovery_service(api)
  },
  'dev-server': async () => {
    // Load key information
    const api = await init_api_as_development_storage_provider()
    console.log('Development Storage Provider identity initialized, proceeding.')

    // Continue with server setup
    const store = get_storage(api)
    banner()

    const { start_syncing } = require('../lib/sync')
    start_syncing(api, cli.flags, store)
    // force listening on port 3001, assuming pioneer dev server is running on 3000
    cli.flags.port = 3001
    announce_public_url(api, `http://localhost:${cli.flags.port}/`)
    await start_all_services(store, api)
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
    console.log('Process exiting gracefully.')
    process.exit(0)
  })
  .catch((err) => {
    console.error(chalk.red(err.stack))
    process.exit(-1)
  })
