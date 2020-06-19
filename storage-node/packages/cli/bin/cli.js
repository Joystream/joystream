#!/usr/bin/env node
/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');

const { RuntimeApi } = require('@joystream/runtime-api');

const meow = require('meow');
const chalk = require('chalk');
const _ = require('lodash');

const debug = require('debug')('joystream:cli');

// Project root
const project_root = path.resolve(__dirname, '..');

// Configuration (default)
const pkg = require(path.resolve(project_root, 'package.json'));

// Parse CLI
const FLAG_DEFINITIONS = {
  // TODO
};

const cli = meow(`
  Usage:
    $ joystream key_file command [options]

  All commands require a key file holding the identity for interacting with the
  runtime API.

  Commands:
    upload            Upload a file to a Colossus storage node. Requires a
                      storage node URL, and a local file name to upload. As
                      an optional third parameter, you can provide a Data
                      Object Type ID - this defaults to "1" if not provided.
    download          Retrieve a file. Requires a storage node URL and a content
                      ID, as well as an output filename.
    head              Send a HEAD request for a file, and print headers.
                      Requires a storage node URL and a content ID.
  `,
  { flags: FLAG_DEFINITIONS });

function assert_file(name, filename)
{
  assert(filename, `Need a ${name} parameter to proceed!`);
  assert(fs.statSync(filename).isFile(), `Path "${filename}" is not a file, aborting!`);
}

const commands = {
  'upload': async (runtime_api, url, filename, do_type_id) => {
    // Check parameters
    assert_file('file', filename);

    const size = fs.statSync(filename).size;
    console.log(`File "${filename}" is ` + chalk.green(size) + ' Bytes.');

    if (!do_type_id) {
      do_type_id = 1;
    }
    console.log('Data Object Type ID is: ' + chalk.green(do_type_id));

    // Generate content ID
    // FIXME this require path is like this because of
    // https://github.com/Joystream/apps/issues/207
    const { ContentId } = require('@joystream/types/lib/media');
    var cid = ContentId.generate();
    cid = cid.encode().toString();
    console.log('Generated content ID: ' + chalk.green(cid));

    // Create Data Object
    const data_object = await runtime_api.assets.createDataObject(
      runtime_api.identities.key.address, cid, do_type_id, size);
    console.log('Data object created.');

    // TODO in future, optionally contact liaison here?
    const request = require('request');
    url = `${url}asset/v0/${cid}`;
    console.log('Uploading to URL', chalk.green(url));

    const f = fs.createReadStream(filename);
    const opts = {
      url: url,
      headers: {
        'content-type': '',
        'content-length': `${size}`,
      },
      json: true,
    };
    return new Promise((resolve, reject) => {
      const r = request.put(opts, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }

        if (response.statusCode / 100 != 2) {
          reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`));
          return;
        }
        console.log('Upload successful:', body.message);
        resolve();
      });
      f.pipe(r);
    });
  },

  'download': async (runtime_api, url, content_id, filename) => {
    const request = require('request');
    url = `${url}asset/v0/${content_id}`;
    console.log('Downloading URL', chalk.green(url), 'to', chalk.green(filename));

    const f = fs.createWriteStream(filename);
    const opts = {
      url: url,
      json: true,
    };
    return new Promise((resolve, reject) => {
      const r = request.get(opts, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }

        console.log('Downloading', chalk.green(response.headers['content-type']), 'of size', chalk.green(response.headers['content-length']), '...');

        f.on('error', (err) => {
          reject(err);
        });

        f.on('finish', () => {
          if (response.statusCode / 100 != 2) {
            reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`));
            return;
          }
          console.log('Download completed.');
          resolve();
        });
      });
      r.pipe(f);
    });
  },

  'head': async (runtime_api, url, content_id) => {
    const request = require('request');
    url = `${url}asset/v0/${content_id}`;
    console.log('Checking URL', chalk.green(url), '...');

    const opts = {
      url: url,
      json: true,
    };
    return new Promise((resolve, reject) => {
      const r = request.head(opts, (error, response, body) => {
        if (error) {
          reject(error);
          return;
        }

        if (response.statusCode / 100 != 2) {
          reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`));
          return;
        }

        for (var propname in response.headers) {
          console.log(`  ${chalk.yellow(propname)}: ${response.headers[propname]}`);
        }

        resolve();
      });
    });
  },

};


async function main()
{
  // Key file is at the first instance.
  const key_file = cli.input[0];
  assert_file('key file', key_file);

  // Create runtime API.
  const runtime_api = await RuntimeApi.create({ account_file: key_file });

  // Simple CLI commands
  const command = cli.input[1];
  if (!command) {
    throw new Error('Need a command to run!');
  }

  if (commands.hasOwnProperty(command)) {
    // Command recognized
    const args = _.clone(cli.input).slice(2);
    await commands[command](runtime_api, ...args);
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
