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
    $ js_storage [options]

  Options:
    --config=PATH, -c PATH  Configuration file path. Defaults to
                            "${default_config.path}".
    --port=PORT, -p PORT    Port number to listen on, defaults to 3000.
    --storage=PATH, -s PATH Storage path to use.
    --storage-type=TYPE     One of "fs", "hyperdrive". Defaults to "fs".
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
var filtered = {}
for (var key in cli.flags) {
  if (key.length == 1 || key == 'config') continue;
  if (cli.flags[key] === undefined) continue;
  filtered[key] = cli.flags[key];
}
debug('argv', filtered);
const config = new configstore(pkg.name, filtered, { configPath: cli.flags.config });
debug(config);

// Start app
console.log(chalk.blue(figlet.textSync('joystream', 'Speed')));
const app = require(path.resolve(project_root, 'lib/app'))(cli.flags, config);
const port = cli.flags.port || config.get('port') || 3000;
app.listen(port);
console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
