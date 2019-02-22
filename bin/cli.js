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
    $ js_storage command [options]

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
  const app = require(path.resolve(project_root, 'lib/app'))(flags, config);
  const port = flags.port || config.get('port') || 3000;
  app.listen(port);
  console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
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
