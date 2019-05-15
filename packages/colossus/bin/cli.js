#!/usr/bin/env node
'use strict';

// Node requires
const path = require('path');

// npm requires
const meow = require('meow');
const configstore = require('configstore');
const chalk = require('chalk');
const figlet = require('figlet');
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
  storage: {
    type: 'string',
    alias: 's',
    _default: path.resolve(project_root, './storage'),
  },
  'storageType': {
    type: 'string',
    _default: 'hyperdrive',
  },
};

const cli = meow(`
  Usage:
    $ colossus [command] [options]

  Commands:
    server [default]  Run a server instance with the given configuration.
    create            Create a repository in the configured storage location.
                      If a second argument is given, it is a directory from which
                      the repository will be populated.
    list              Output a list of storage entries. If an argument is given,
                      it is interpreted as a repo ID, and the contents of the
                      repo are listed instead.
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
    --storage=PATH, -s PATH Storage path to use.
    --storage-type=TYPE     One of "fs", "hyperdrive". Defaults to "hyperdrive".
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
function start_app(project_root, store, api, config)
{
  const app = require('../lib/app')(store, api, config);
  const port = config.get('port');
  app.listen(port);
  console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
}

// Get an initialized storage instance
function get_storage(config)
{
  const store_path = config.get('storage');
  const store_type = config.get('storageType');

  const storage = require('@joystream/storage');

  const store = new storage.Storage(store_path, storage.DEFAULT_POOL_SIZE,
      store_type);

  return store;
}

// List repos in a storage
function list_repos(store)
{
  console.log('Repositories in storage:');
  store.repos((err, id) => {
    if (err) {
      console.log(err);
      return;
    }
    if (!id) {
      return;
    }
    console.log(`  ${id}`);
  });
}

// List repository contents
function list_repo(store, repo_id)
{
  console.log(`Contents of repository "${repo_id}":`);
  const repo = store.get(repo_id);
  const fswalk = require('@joystream/util/fs/walk');
  const siprefix = require('si-prefix');

  fswalk('/', repo.archive, (err, relname, stat) => {
    if (err) {
      throw err;
    }
    if (!relname) {
      return;
    }

    var line = stat.ctime.toUTCString() + '  ';
    if (stat.isDirectory()) {
      line += 'D  ';
    }
    else {
      line += 'F  ';
    }

    var size = '-';
    if (stat.isFile()) {
      var info = siprefix.byte.convert(stat.size);
      size = `${Math.ceil(info[0])} ${info[1]}`;
    }
    while (size.length < 8) {
      size = ' ' + size;
    }

    line += size + '  ' + relname;

    console.log('  ' + line);
  });
}

async function run_signup(account_file)
{
  const runtime_api = require('@joystream/runtime-api');
  const api = await runtime_api.create(account_file);
  const member_address = api.key.address();

  // Check if account works
  const min = await api.requiredBalanceForRoleStaking(api.ROLE_STORAGE);
  console.log(`Account needs to be a member and have a minimum balance of ${min.toString()}`);
  const check = await api.checkAccountForStaking(member_address);
  if (check) {
    console.log('Account is working for staking, proceeding.');
  }

  // Create a role key
  const role_key = await api.createRoleKey(member_address);
  const role_address = role_key.address();
  console.log('Generated', role_address, '- this is going to be exported to a JSON file.\n',
    ' You can provide an empty passphrase to make starting the server easier,\n',
    ' but you must keep the file very safe, then.');
  const filename = await api.writeKeyPairExport(role_address);
  console.log('Identity stored in', filename);

  // Ok, transfer for staking.
  await api.transferForStaking(member_address, role_address, api.ROLE_STORAGE);
  console.log('Funds transferred.');

  // Now apply for the role
  await api.applyForRole(role_address, api.ROLE_STORAGE, member_address);
  console.log('Role application sent.\nNow visit Roles > My Requests in the app.');
}

async function wait_for_role(config)
{
  // Load key information
  const runtime_api = require('@joystream/runtime-api');
  const keyFile = config.get('keyFile');
  if (!keyFile) {
    throw new Error("Must specify a key file for running a storage node! Sign up for the role; see `colussus --help' for details.");
  }
  const api = await runtime_api.create(keyFile);

  // Wait for the account role to be finalized
  console.log('Waiting for the account to be staked as a storage provider role...');
  const result = await api.waitForRole(api.key.address(), api.ROLE_STORAGE);
  return [result, api];
}

// Simple CLI commands
var command = cli.input[0];
if (!command) {
  command = 'server';
}

const commands = {
  'server': () => {
    const cfg = create_config(pkg.name, cli.flags);

    // Load key information
    const errfunc = (err) => {
      console.log(err);
      process.exit(-1);
    }

    const promise = wait_for_role(cfg);
    promise
      .then((values) => {
        const result = values[0]
        const api = values[1];
        if (!result) {
          throw new Error(`Not staked as storage role.`);
        }
        console.log('Staked, proceeding.');

        // Continue with server setup
        const store = get_storage(cfg);
        banner();
        start_app(project_root, store, api, cfg);
      })
      .catch(errfunc);
  },
  'create': () => {
    const cfg = create_config(pkg.name, cli.flags);
    const store = get_storage(cfg);

    if (store.new) {
      console.log('Storage created.');
    }
    else {
      console.log('Storage already existed, not created.');
    }

    // Create the repo
    const template_path = cli.input[1];
    if (template_path) {
      console.log('Creating repository...');
    }
    else {
      console.log(`Creating repository from template "${template_path}"...`);
    }
    store.create(undefined, template_path, (err, id, repo) => {
      if (err) {
        throw err;
      }

      console.log('Repository created with id:', id);
    });
  },
  'list': () => {
    const cfg = create_config(pkg.name, cli.flags);
    const store = get_storage(cfg);

    const repo_id = cli.input[1];
    if (repo_id) {
      list_repo(store, repo_id);
    }
    else {
      list_repos(store);
    }
  },
  'signup': () => {
    const account_file = cli.input[1];
    const ret = run_signup(account_file);
    ret.catch(console.error).finally(_ => process.exit());
  },
};

if (commands.hasOwnProperty(command)) {
  // Command recognized
  commands[command]();
}
else {
  // An error!
  console.log(chalk.red(`Command "${command}" not recognized, aborting!`));
  process.exit(1);
}
