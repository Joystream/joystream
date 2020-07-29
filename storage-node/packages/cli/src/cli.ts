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

import { RuntimeApi } from '@joystream/storage-runtime-api'
import meow from 'meow'
import _ from 'lodash'

// Commands
import * as dev from './commands/dev'
import { HeadCommand } from './commands/head'
import { DownloadCommand } from './commands/download'
import { UploadCommand } from './commands/upload'

// Parse CLI
const FLAG_DEFINITIONS = {
  // TODO: current version of meow doesn't support subcommands. We should consider a migration to yargs or oclif.
}

const usage = `
  Usage:
    $ storage-cli command [arguments..]

  Commands:
    upload            Upload a file to the Joystream Network. Requires a
                      source file path to upload, data object ID, member ID and account key file with
                      pass phrase to unlock it.
    download          Retrieve a file. Requires a storage node URL and a content
                      ID, as well as an output filename.
    head              Send a HEAD request for a file, and print headers.
                      Requires a storage node URL and a content ID.

  Dev Commands:       Commands to run on a development chain.
    dev-init          Setup chain with Alice as lead and storage provider.
    dev-check         Check the chain is setup with Alice as lead and storage provider.
    vstore-init      Initialize versioned store, Requires SURI of ContentWorking Lead.
    
  Type 'storage-cli command' for the exact command usage examples.
  `

const cli = meow(usage, { flags: FLAG_DEFINITIONS })

// Shows a message, CLI general usage and exits.
function showUsageAndExit(message: string) {
  console.log(message)
  console.log(usage)
  process.exit(1)
}

const commands = {
  // add Alice well known account as storage provider
  'dev-init': async (api) => {
    // dev accounts are automatically loaded, no need to add explicitly to keyring using loadIdentity(api)
    return dev.init(api)
  },
  // Checks that the setup done by dev-init command was successful
  'dev-check': async (api) => {
    // dev accounts are automatically loaded, no need to add explicitly to keyring using loadIdentity(api)
    return dev.check(api)
  },
  // Runs the versioned store initialization with given SURI of content working group lead
  'vstore-init': async (api, suri: string) => {
    return dev.vstoreInit(api, suri)
  },
  // Uploads the file to the system. Registers new data object in the runtime, obtains proper colossus instance URL.
  upload: async (
    api: any,
    filePath: string,
    dataObjectTypeId: string,
    keyFile: string,
    passPhrase: string,
    memberId: string
  ) => {
    const uploadCmd = new UploadCommand(api, filePath, dataObjectTypeId, keyFile, passPhrase, memberId)

    await uploadCmd.run()
  },
  // needs to be updated to take a content id and resolve it a potential set
  // of providers that has it, and select one (possibly try more than one provider)
  // to fetch it from the get api url of a provider..
  download: async (api: any, url: string, contentId: string, filePath: string) => {
    const downloadCmd = new DownloadCommand(api, url, contentId, filePath)

    await downloadCmd.run()
  },
  // Shows asset information derived from response headers.
  // Accepts colossus URL and content ID.
  head: async (api: any, storageNodeUrl: string, contentId: string) => {
    const headCmd = new HeadCommand(api, storageNodeUrl, contentId)

    await headCmd.run()
  },
}

// Entry point.
export async function main() {
  const api = await RuntimeApi.create()

  // Simple CLI commands
  const command = cli.input[0]
  if (!command) {
    showUsageAndExit('Enter the command, please.')
  }

  if (Object.prototype.hasOwnProperty.call(commands, command)) {
    // Command recognized
    const args = _.clone(cli.input).slice(1)
    try {
      await commands[command](api, ...args)
    } catch (err) {
      console.error('Command Failed:', err)
      process.exit(-1)
    }
  } else {
    showUsageAndExit(`Command "${command}" not recognized.`)
  }
}
