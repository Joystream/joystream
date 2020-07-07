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

'use strict'

const fs = require('fs')
const assert = require('assert')
const { RuntimeApi } = require('@joystream/storage-runtime-api')
const meow = require('meow')
const chalk = require('chalk')
const _ = require('lodash')
const debug = require('debug')('joystream:storage-cli')
const dev = require('./dev')

// Parse CLI
const FLAG_DEFINITIONS = {
  // TODO
}

const cli = meow(`
  Usage:
    $ storage-cli command [arguments..] [key_file] [passphrase]

  Some commands require a key file as the last option holding the identity for
  interacting with the runtime API.

  Commands:
    upload            Upload a file to a Colossus storage node. Requires a
                      storage node URL, and a local file name to upload. As
                      an optional third parameter, you can provide a Data
                      Object Type ID - this defaults to "1" if not provided.
    download          Retrieve a file. Requires a storage node URL and a content
                      ID, as well as an output filename.
    head              Send a HEAD request for a file, and print headers.
                      Requires a storage node URL and a content ID.

  Dev Commands:       Commands to run on a development chain.
    dev-init          Setup chain with Alice as lead and storage provider.
    dev-check         Check the chain is setup with Alice as lead and storage provider.
  `,
  { flags: FLAG_DEFINITIONS })

function assert_file (name, filename) {
  assert(filename, `Need a ${name} parameter to proceed!`)
  assert(fs.statSync(filename).isFile(), `Path "${filename}" is not a file, aborting!`)
}

function load_identity (api, filename, passphrase) {
  if (filename) {
    assert_file('keyfile', filename)
    api.identities.loadUnlock(filename, passphrase)
  } else {
    debug('Loading Alice as identity')
    api.identities.useKeyPair(dev.aliceKeyPair(api))
  }
}

const commands = {
  // add Alice well known account as storage provider
  'dev-init': async (api) => {
    // dev accounts are automatically loaded, no need to add explicitly to keyring
    // load_identity(api)
    let dev = require('./dev')
    return dev.init(api)
  },
  // Checks that the setup done by dev-init command was successful.
  'dev-check': async (api) => {
    // dev accounts are automatically loaded, no need to add explicitly to keyring
    // load_identity(api)
    let dev = require('./dev')
    return dev.check(api)
  },
  // The upload method is not correctly implemented
  // needs to get the liaison after creating a data object,
  // resolve the ipns id to the asset put api url of the storage-node
  // before uploading..
  'upload': async (api, url, filename, do_type_id, keyfile, passphrase) => {
    load_identity(keyfile, passphrase)
    // Check parameters
    assert_file('file', filename)

    const size = fs.statSync(filename).size
    debug(`File "${filename}" is ${chalk.green(size)} Bytes.`)

    if (!do_type_id) {
      do_type_id = 1
    }

    debug('Data Object Type ID is: ' + chalk.green(do_type_id))

    // Generate content ID
    // FIXME this require path is like this because of
    // https://github.com/Joystream/apps/issues/207
    const { ContentId } = require('@joystream/types/media')
    var cid = ContentId.generate()
    cid = cid.encode().toString()
    debug('Generated content ID: ' + chalk.green(cid))

    // Create Data Object
    const data_object = await api.assets.createDataObject(
      api.identities.key.address, cid, do_type_id, size)
    debug('Data object created.')

    // TODO in future, optionally contact liaison here?
    const request = require('request')
    url = `${url}asset/v0/${cid}`
    debug('Uploading to URL', chalk.green(url))

    const f = fs.createReadStream(filename)
    const opts = {
      url: url,
      headers: {
        'content-type': '',
        'content-length': `${size}`
      },
      json: true
    }
    return new Promise((resolve, reject) => {
      const r = request.put(opts, (error, response, body) => {
        if (error) {
          reject(error)
          return
        }

        if (response.statusCode / 100 !== 2) {
          reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`))
          return
        }
        debug('Upload successful:', body.message)
        resolve()
      })
      f.pipe(r)
    })
  },
  // needs to be updated to take a content id and resolve it a potential set
  // of providers that has it, and select one (possibly try more than one provider)
  // to fetch it from the get api url of a provider..
  'download': async (api, url, content_id, filename) => {
    const request = require('request')
    url = `${url}asset/v0/${content_id}`
    debug('Downloading URL', chalk.green(url), 'to', chalk.green(filename))

    const f = fs.createWriteStream(filename)
    const opts = {
      url: url,
      json: true
    }
    return new Promise((resolve, reject) => {
      const r = request.get(opts, (error, response, body) => {
        if (error) {
          reject(error)
          return
        }

        debug('Downloading', chalk.green(response.headers['content-type']), 'of size', chalk.green(response.headers['content-length']), '...')

        f.on('error', (err) => {
          reject(err)
        })

        f.on('finish', () => {
          if (response.statusCode / 100 !== 2) {
            reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`))
            return
          }
          debug('Download completed.')
          resolve()
        })
      })
      r.pipe(f)
    })
  },
  // similar to 'download' function
  'head': async (api, url, content_id) => {
    const request = require('request')
    url = `${url}asset/v0/${content_id}`
    debug('Checking URL', chalk.green(url), '...')

    const opts = {
      url: url,
      json: true
    }
    return new Promise((resolve, reject) => {
      const r = request.head(opts, (error, response, body) => {
        if (error) {
          reject(error)
          return
        }

        if (response.statusCode / 100 !== 2) {
          reject(new Error(`${response.statusCode}: ${body.message || 'unknown reason'}`))
          return
        }

        for (var propname in response.headers) {
          debug(`  ${chalk.yellow(propname)}: ${response.headers[propname]}`)
        }

        resolve()
      })
    })
  }
}

async function main () {
  const api = await RuntimeApi.create()

  // Simple CLI commands
  const command = cli.input[0]
  if (!command) {
    throw new Error('Need a command to run!')
  }

  if (commands.hasOwnProperty(command)) {
    // Command recognized
    const args = _.clone(cli.input).slice(1)
    await commands[command](api, ...args)
  } else {
    throw new Error(`Command "${command}" not recognized, aborting!`)
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
