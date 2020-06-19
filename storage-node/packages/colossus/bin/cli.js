#!/usr/bin/env node
'use strict';

// Node requires
const path = require('path');

// npm requires
const meow = require('meow');
const configstore = require('configstore');
const chalk = require('chalk');
const figlet = require('figlet');
const _ = require('lodash');

const debug = require('debug')('joystream:cli');

// Project root
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Configuration (default)
const pkg = require(path.resolve(PROJECT_ROOT, 'package.json'));
const default_config = new configstore(pkg.name);

// Parse CLI
const FLAG_DEFINITIONS = {
  port: {
    type: 'integer',
    alias: 'p',
    _default: 3000,
  },
  'syncPeriod': {
    type: 'integer',
    _default: 120000,
  },
  keyFile: {
    type: 'string',
  },
  config: {
    type: 'string',
    alias: 'c',
  },
  'publicUrl': {
    type: 'string',
    alias: 'u'
  },
  'passphrase': {
    type: 'string'
  },
  'wsProvider': {
    type: 'string',
    _default: 'ws://localhost:9944'
  }
};

const cli = meow(`
  Usage:
    $ colossus [command] [options]

  Commands:
    server [default]  Run a server instance with the given configuration.
    signup            Sign up as a storage provider. Requires that you provide
                      a JSON account file of an account that is a member, and has
                      sufficient balance for staking as a storage provider.
                      Writes a new account file that should be used to run the
                      storage node.
    down              Signal to network that all services are down. Running
                      the server will signal that services as online again.
    discovery         Run the discovery service only.

  Options:
    --config=PATH, -c PATH  Configuration file path. Defaults to
                            "${default_config.path}".
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --sync-period           Number of milliseconds to wait between synchronization
                            runs. Defaults to 30,000 (30s).
    --key-file              JSON key export file to use as the storage provider.
    --passphrase            Optional passphrase to use to decrypt the key-file (if its encrypted).
    --public-url            API Public URL to announce. No URL will be announced if not specified.
    --ws-provider           Joystream Node websocket provider url, eg: "ws://127.0.0.1:9944"
  `,
  { flags: FLAG_DEFINITIONS });

// Create configuration
function create_config(pkgname, flags)
{
  // Create defaults from flag definitions
  const defaults = {};
  for (var key in FLAG_DEFINITIONS) {
    const defs = FLAG_DEFINITIONS[key];
    if (defs._default) {
      defaults[key] = defs._default;
    }
  }

  // Provide flags as defaults. Anything stored in the config overrides.
  var config = new configstore(pkgname, defaults, { configPath: flags.config });

  // But we want the flags to also override what's stored in the config, so
  // set them all.
  for (var key in flags) {
    // Skip aliases and self-referential config flag
    if (key.length == 1 || key === 'config') continue;
    // Skip sensitive flags
    if (key == 'passphrase') continue;
    // Skip unset flags
    if (!flags[key]) continue;
    // Otherwise set.
    config.set(key, flags[key]);
  }

  debug('Configuration at', config.path, config.all);
  return config;
}

// All-important banner!
function banner()
{
  console.log(chalk.blue(figlet.textSync('joystream', 'Speed')));
}

function start_express_app(app, port) {
  const http = require('http');
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.on('close', (...args) => {
      console.log('Server closed, shutting down...');
      resolve(...args);
    });
    server.on('listening', () => {
      console.log('API server started.', server.address());
    });
    server.listen(port, '::');
    console.log('Starting API server...');
  });
}
// Start app
function start_all_services(store, api, config)
{
  const app = require('../lib/app')(PROJECT_ROOT, store, api, config);
  const port = config.get('port');
  return start_express_app(app, port);
}

// Start discovery service app
function start_discovery_service(api, config)
{
  const app = require('../lib/discovery')(PROJECT_ROOT, api, config);
  const port = config.get('port');
  return start_express_app(app, port);
}

// Get an initialized storage instance
function get_storage(runtime_api, config)
{
  // TODO at some point, we can figure out what backend-specific connection
  // options make sense. For now, just don't use any configuration.
  const { Storage } = require('@joystream/storage');

  const options = {
    resolve_content_id: async (content_id) => {
      // Resolve via API
      const obj = await runtime_api.assets.getDataObject(content_id);
      if (!obj || obj.isNone) {
        return;
      }

      return obj.unwrap().ipfs_content_id.toString();
    },
  };

  return Storage.create(options);
}

async function run_signup(account_file, provider_url)
{
  if (!account_file) {
    console.log('Cannot proceed without keyfile');
    return
  }

  const { RuntimeApi } = require('@joystream/runtime-api');
  const api = await RuntimeApi.create({account_file, canPromptForPassphrase: true, provider_url});

  if (!api.identities.key) {
    console.log('Cannot proceed without a member account');
    return
  }

  // Check there is an opening
  let availableSlots = await api.roles.availableSlotsForRole(api.roles.ROLE_STORAGE);

  if (availableSlots == 0) {
    console.log(`
      There are no open storage provider slots available at this time.
      Please try again later.
    `);
    return;
  } else {
    console.log(`There are still ${availableSlots} slots available, proceeding`);
  }

  const member_address = api.identities.key.address;

  // Check if account works
  const min = await api.roles.requiredBalanceForRoleStaking(api.roles.ROLE_STORAGE);
  console.log(`Account needs to be a member and have a minimum balance of ${min.toString()}`);
  const check = await api.roles.checkAccountForStaking(member_address);
  if (check) {
    console.log('Account is working for staking, proceeding.');
  }

  // Create a role key
  const role_key = await api.identities.createRoleKey(member_address);
  const role_address = role_key.address;
  console.log('Generated', role_address, '- this is going to be exported to a JSON file.\n',
    ' You can provide an empty passphrase to make starting the server easier,\n',
    ' but you must keep the file very safe, then.');
  const filename = await api.identities.writeKeyPairExport(role_address);
  console.log('Identity stored in', filename);

  // Ok, transfer for staking.
  await api.roles.transferForStaking(member_address, role_address, api.roles.ROLE_STORAGE);
  console.log('Funds transferred.');

  // Now apply for the role
  await api.roles.applyForRole(role_address, api.roles.ROLE_STORAGE, member_address);
  console.log('Role application sent.\nNow visit Roles > My Requests in the app.');
}

async function wait_for_role(config)
{
  // Load key information
  const { RuntimeApi } = require('@joystream/runtime-api');
  const keyFile = config.get('keyFile');
  if (!keyFile) {
    throw new Error("Must specify a key file for running a storage node! Sign up for the role; see `colussus --help' for details.");
  }
  const wsProvider = config.get('wsProvider');

  const api = await RuntimeApi.create({
    account_file: keyFile,
    passphrase: cli.flags.passphrase,
    provider_url: wsProvider,
  });

  if (!api.identities.key) {
    throw new Error('Failed to unlock storage provider account');
  }

  // Wait for the account role to be finalized
  console.log('Waiting for the account to be staked as a storage provider role...');
  const result = await api.roles.waitForRole(api.identities.key.address, api.roles.ROLE_STORAGE);
  return [result, api];
}

function get_service_information(config) {
  // For now assume we run all services on the same endpoint
  return({
    asset: {
      version: 1, // spec version
      endpoint: config.get('publicUrl')
    },
    discover: {
      version: 1, // spec version
      endpoint: config.get('publicUrl')
    }
  })
}

async function announce_public_url(api, config) {
  // re-announce in future
  const reannounce = function (timeoutMs) {
    setTimeout(announce_public_url, timeoutMs, api, config);
  }

  debug('announcing public url')
  const { publish } = require('@joystream/discovery')

  const accountId = api.identities.key.address

  try {
    const serviceInformation = get_service_information(config)

    let keyId = await publish.publish(serviceInformation);

    const expiresInBlocks = 600; // ~ 1 hour (6s block interval)
    await api.discovery.setAccountInfo(accountId, keyId, expiresInBlocks);

    debug('publishing complete, scheduling next update')

// >> sometimes after tx is finalized.. we are not reaching here!

    // Reannounce before expiery
    reannounce(50 * 60 * 1000); // in 50 minutes

  } catch (err) {
    debug(`announcing public url failed: ${err.stack}`)

    // On failure retry sooner
    debug(`announcing failed, retrying in: 2 minutes`)
    reannounce(120 * 1000)
  }
}

function go_offline(api) {
  return api.discovery.unsetAccountInfo(api.identities.key.address)
}

// Simple CLI commands
var command = cli.input[0];
if (!command) {
  command = 'server';
}

const commands = {
  'server': async () => {
    const cfg = create_config(pkg.name, cli.flags);

    // Load key information
    const values = await wait_for_role(cfg);
    const result = values[0]
    const api = values[1];
    if (!result) {
      throw new Error(`Not staked as storage role.`);
    }
    console.log('Staked, proceeding.');

    // Make sure a public URL is configured
    if (!cfg.get('publicUrl')) {
      throw new Error('publicUrl not configured')
    }

    // Continue with server setup
    const store = get_storage(api, cfg);
    banner();

    const { start_syncing } = require('../lib/sync');
    start_syncing(api, cfg, store);

    announce_public_url(api, cfg);
    await start_all_services(store, api, cfg);
  },
  'signup': async (account_file) => {
    const cfg = create_config(pkg.name, cli.flags);
    await run_signup(account_file, cfg.get('wsProvider'));
  },
  'down': async () => {
    const cfg = create_config(pkg.name, cli.flags);

    const values = await wait_for_role(cfg);
    const result = values[0]
    const api = values[1];
    if (!result) {
      throw new Error(`Not staked as storage role.`);
    }

    await go_offline(api)
  },
  'discovery': async () => {
    debug("Starting Joystream Discovery Service")
    const { RuntimeApi } = require('@joystream/runtime-api')
    const cfg = create_config(pkg.name, cli.flags)
    const wsProvider = cfg.get('wsProvider');
    const api = await RuntimeApi.create({ provider_url: wsProvider });
    await start_discovery_service(api, cfg)
  }
};


async function main()
{
  // Simple CLI commands
  var command = cli.input[0];
  if (!command) {
    command = 'server';
  }

  if (commands.hasOwnProperty(command)) {
    // Command recognized
    const args = _.clone(cli.input).slice(1);
    await commands[command](...args);
  }
  else {
    throw new Error(`Command "${command}" not recognized, aborting!`);
  }
}

main()
  .then(() => {
    console.log('Process exiting gracefully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error(chalk.red(err.stack));
    process.exit(-1);
  });
