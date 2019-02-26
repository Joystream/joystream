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
const cli = meow(`
  Usage:
    $ js_storage [command] [options]

  Commands:
    server [default]  Run a server instance with the given configuration.
    create            Create a repository in the configured storage location.
                      If a second argument is given, it is a directory from which
                      the repository will be populated.
    list              Output a list of storage entries. If an argument is given,
                      it is interpreted as a repo ID, and the contents of the
                      repo are listed instead.

  Options:
    --config=PATH, -c PATH  Configuration file path. Defaults to
                            "${default_config.path}".
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --storage=PATH, -s PATH Storage path to use.
    --storage-type=TYPE     One of "fs", "hyperdrive". Defaults to "hyperdrive".
  `, {
    flags: {
      port: {
        type: 'integer',
        alias: 'p',
        default: undefined,
      },
      config: {
        type: 'string',
        alias: 'c',
        default: undefined,
      },
      storage: {
        type: 'string',
        alias: 's',
        default: undefined,
      },
      'storage-type': {
        type: 'string',
        default: undefined,
      },
    },
});

// Create configuration
function create_config(pkgname, flags)
{
  var filtered = {}
  for (var key in flags) {
    if (key.length == 1 || key == 'config') continue;
    if (flags[key] === undefined) continue;
    filtered[key] = flags[key];
  }
  debug('argv', filtered);
  var config = new configstore(pkgname, filtered, { configPath: flags.config });
  debug(config);
  return config;
}

// Start app
function start_app(project_root, config, flags)
{
  console.log(chalk.blue(figlet.textSync('joystream', 'Speed')));
  const app = require('joystream/app')(flags, config);
  const port = flags.port || config.get('port') || 3000;
  app.listen(port);
  console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
}

// Get an initialized storage instance
function get_storage(config, flags)
{
  const store_path = flags.storage || config.get('storage') || './storage';
  const store_type = flags['storage-type'] || config.get('storage-type') || 'hyperdrive';

  const storage = require('joystream/core/storage');

  const store = new storage.Storage(store_path, storage.DEFAULT_POOL_SIZE,
      store_type == "fs");

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
    console.log(`  ${id}`);
  });
}

// List repository contents
function list_repo(store, repo_id)
{
  console.log(`Contents of repository "${repo_id}":`);
  const repo = store.get(repo_id);
  const fswalk = require('joystream/util/fs/walk');
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

// Simple CLI commands
var command = cli.input[0];
if (!command) {
  command = 'server';
}

const commands = {
  'server': () => {
    const cfg = create_config(pkg.name, cli.flags);
    start_app(project_root, cfg, cli.flags);
  },
  'create': () => {
    const cfg = create_config(pkg.name, cli.flags);
    const store = get_storage(cfg, cli.flags);

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
    const store = get_storage(cfg, cli.flags);

    const repo_id = cli.input[1];
    if (repo_id) {
      list_repo(store, repo_id);
    }
    else {
      list_repos(store);
    }
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
