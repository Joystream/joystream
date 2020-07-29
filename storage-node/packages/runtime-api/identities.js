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
 * but WITHOUT ANY WARRANTY without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

'use strict'

const path = require('path')
const fs = require('fs')
const debug = require('debug')('joystream:runtime:identities')
const { Keyring } = require('@polkadot/keyring')
const utilCrypto = require('@polkadot/util-crypto')

/*
 * Add identity management to the substrate API.
 *
 * This loosely groups: accounts, key management, and membership.
 */
class IdentitiesApi {
  static async create(base, { accountFile, passphrase, canPromptForPassphrase }) {
    const ret = new IdentitiesApi()
    ret.base = base
    await ret.init(accountFile, passphrase, canPromptForPassphrase)
    return ret
  }

  async init(accountFile, passphrase, canPromptForPassphrase) {
    debug('Init')

    // Creatre keyring
    this.keyring = new Keyring()

    this.canPromptForPassphrase = canPromptForPassphrase || false

    // Load account file, if possible.
    try {
      this.key = await this.loadUnlock(accountFile, passphrase)
    } catch (err) {
      debug('Error loading account file:', err.message)
    }
  }

  /*
   * Load a key file and unlock it if necessary.
   */
  async loadUnlock(accountFile, passphrase) {
    const fullname = path.resolve(accountFile)
    debug('Initializing key from', fullname)
    const key = this.keyring.addFromJson(require(fullname))
    await this.tryUnlock(key, passphrase)
    debug('Successfully initialized with address', key.address)
    return key
  }

  /*
   * Try to unlock a key if it isn't already unlocked.
   * passphrase should be supplied as argument.
   */
  async tryUnlock(key, passphrase) {
    if (!key.isLocked) {
      debug('Key is not locked, not attempting to unlock')
      return
    }

    // First try with an empty passphrase - for convenience
    try {
      key.decodePkcs8('')

      if (passphrase) {
        debug('Key was not encrypted, supplied passphrase was ignored')
      }

      return
    } catch (err) {
      // pass
    }

    // Then with supplied passphrase
    try {
      debug('Decrypting with supplied passphrase')
      key.decodePkcs8(passphrase)
      return
    } catch (err) {
      // pass
    }

    // If that didn't work, ask for a passphrase if appropriate
    if (this.canPromptForPassphrase) {
      passphrase = await this.askForPassphrase(key.address)
      key.decodePkcs8(passphrase)
      return
    }

    throw new Error('invalid passphrase supplied')
  }

  /*
   * Ask for a passphrase
   */

  /* eslint-disable class-methods-use-this */
  // Disable lint because the method used by a mocking library.
  askForPassphrase(address) {
    // Query for passphrase
    const prompt = require('password-prompt')
    return prompt(`Enter passphrase for ${address}: `, { required: false })
  }

  /*
   * Return true if the account is a root account of a member
   */
  async isMember(accountId) {
    const memberIds = await this.memberIdsOf(accountId) // return array of member ids
    return memberIds.length > 0 // true if at least one member id exists for the acccount
  }

  /*
   * Return all the member IDs of an account by the root account id
   */
  async memberIdsOf(accountId) {
    const decoded = this.keyring.decodeAddress(accountId)
    return this.base.api.query.members.memberIdsByRootAccountId(decoded)
  }

  /*
   * Return the first member ID of an account, or undefined if not a member root account.
   */
  async firstMemberIdOf(accountId) {
    const decoded = this.keyring.decodeAddress(accountId)
    const ids = await this.base.api.query.members.memberIdsByRootAccountId(decoded)
    return ids[0]
  }

  /*
   * Export a key pair to JSON. Will ask for a passphrase.
   */
  async exportKeyPair(accountId) {
    const passphrase = await this.askForPassphrase(accountId)

    // Produce JSON output
    return this.keyring.toJson(accountId, passphrase)
  }

  /*
   * Export a key pair and write it to a JSON file with the account ID as the
   * name.
   */
  async writeKeyPairExport(accountId, prefix) {
    // Generate JSON
    const data = await this.exportKeyPair(accountId)

    // Write JSON
    let filename = `${data.address}.json`

    if (prefix) {
      const path = require('path')
      filename = path.resolve(prefix, filename)
    }

    fs.writeFileSync(filename, JSON.stringify(data), {
      encoding: 'utf8',
      mode: 0o600,
    })

    return filename
  }

  /*
   * Register account id with userInfo as a new member
   * using default policy 0, returns new member id
   */
  async registerMember(accountId, userInfo) {
    const tx = this.base.api.tx.members.buyMembership(0, userInfo)

    return this.base.signAndSendThenGetEventResult(accountId, tx, {
      module: 'members',
      event: 'MemberRegistered',
      type: 'MemberId',
      index: 0,
    })
  }

  /*
   * Injects a keypair and sets it as the default identity
   */
  useKeyPair(keyPair) {
    this.key = this.keyring.addPair(keyPair)
  }

  /*
   * Create a new role key. If no name is given,
   * default to 'storage'.
   */
  async createNewRoleKey(name) {
    name = name || 'storage-provider'

    // Generate new key pair
    const keyPair = utilCrypto.naclKeypairFromRandom()

    // Encode to an address.
    const addr = this.keyring.encodeAddress(keyPair.publicKey)
    debug('Generated new key pair with address', addr)

    // Add to key wring. We set the meta to identify the account as
    // a role key.
    const meta = {
      name: `${name} role account`,
    }

    const createPair = require('@polkadot/keyring/pair').default
    const pair = createPair('ed25519', keyPair, meta)

    this.keyring.addPair(pair)

    return pair
  }

  getSudoAccount() {
    return this.base.api.query.sudo.key()
  }
}

module.exports = {
  IdentitiesApi,
}
