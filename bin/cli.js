#!/usr/bin/env node
'use strict';

// Node requires
const path = require('path');

// npm requires
const meow = require('meow');
const configstore = require('configstore');
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
const app = require(path.resolve(project_root, 'lib/app'));
const port = cli.flags.port || config.get('port') || 3000;
app.listen(port);
console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
