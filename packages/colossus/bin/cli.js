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
const project_root = path.resolve(__dirname, '..');

// Configuration (default)
const pkg = require(path.resolve(project_root, 'package.json'));
const default_config = new configstore(pkg.name);

// Parse CLI
const FLAG_DEFINITIONS = {
  port: {
    type: 'integer',
    alias: 'p',
    _default: 3000,
  },
  'syncPeriod': { // TODO Keep for later
    type: 'integer',
    _default: 30000,
  },
  keyFile: {
    type: 'string',
  },
  config: {
    type: 'string',
    alias: 'c',
  },
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

  Options:
    --config=PATH, -c PATH  Configuration file path. Defaults to
                            "${default_config.path}".
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --sync-period           Number of milliseconds to wait between synchronization
                            runs. Defaults to 30,000 (30s).
    --key-file              JSON key export file to use as the storage provider.
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

// Start app
async function start_app(project_root, store, api, config)
{
  const app = require('../lib/app')(store, api, config);
  const port = config.get('port');

  const http = require('http');
  const server = http.createServer(app);

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.on('close', (...args) => {
      console.log('Server closed, shutting down...');
      resolve(...args);
    });
    server.listen(port);
    console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
  });
}

// Get an initialized storage instance
async function get_storage(runtime_api, config)
{
  // TODO at some point, we can figure out what backend-specific connection
  // options make sense. For now, just don't use any configuration.
  const { Storage } = require('@joystream/storage');

  const options = {
    resolve_content_id: async (content_id) => {
      const meta = await runtime_api.assets.getStorageMetadata(content_id);
      if (!meta) {
        return;
      }
      // TODO should check version, but for now this is probably fine.
      return meta.ipfs_content_id;
    },
  };

  return await Storage.create(options);
}

async function run_signup(account_file)
{
  const { RuntimeApi } = require('@joystream/runtime-api');
  const api = await RuntimeApi.create({account_file});
  const member_address = api.identities.key.address();

  // Check if account works
  const min = await api.roles.requiredBalanceForRoleStaking(api.roles.ROLE_STORAGE);
  console.log(`Account needs to be a member and have a minimum balance of ${min.toString()}`);
  const check = await api.roles.checkAccountForStaking(member_address);
  if (check) {
    console.log('Account is working for staking, proceeding.');
  }

  // Create a role key
  const role_key = await api.identities.createRoleKey(member_address);
  const role_address = role_key.address();
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
  const api = await RuntimeApi.create({account_file: keyFile});

  // Wait for the account role to be finalized
  console.log('Waiting for the account to be staked as a storage provider role...');
  const result = await api.roles.waitForRole(api.identities.key.address(), api.roles.ROLE_STORAGE);
  return [result, api];
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

    // Continue with server setup
    const store = await get_storage(api, cfg);
    banner();
    await start_app(project_root, store, api, cfg);
  },
  'signup': async (account_file) => {
    await run_signup(account_file);
  },
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
