'use strict';

const path = require('path');
const fs = require('fs');
const readline = require('readline');

const debug = require('debug')('joystream:substrate:identities');

const { Keyring } = require('@polkadot/keyring');
const { Null } = require('@polkadot/types/primitive');
const util_crypto = require('@polkadot/util-crypto');

const { _ } = require('lodash');

const { SubstrateApi } = require('joystream/substrate/base');

class IdentitiesApi extends SubstrateApi
{
  static async create(account_file)
  {
    const ret = new IdentitiesApi();
    await ret.init(account_file);
    return ret;
  }

  async init(account_file)
  {
    debug('Init');

    // Super init
    await super.init();

    // Creatre keyring
    this.keyring = new Keyring();

    // Load account file, if possible.
    const fullname = path.resolve(account_file);
    debug('Initializing key from', fullname);
    this.key = this.keyring.addFromJson(require(fullname));
    await this.tryUnlock(this.key);
    debug('Successfully initialized with address', this.key.address());
  }

  async tryUnlock(key)
  {
    if (!key.isLocked()) {
      return;
    }

    // First try with an empty passphrase - for convenience
    try {
      key.decodePkcs8('');
      return;
    } catch (err) {
      // pass
    }

    // If that didn't work, ask for a passphrase.
    const passphrase = await this.askForPassphrase(this.key.address());
    key.decodePkcs8(passphrase);
  }

  async askForPassphrase(address)
  {
    // Query for passphrase
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (str) => new Promise(resolve => rl.question(str, resolve));
    const passphrase = await question(`Enter passphrase for ${address}: `);
    rl.close();
    return passphrase;
  }

  async isMember(accountId)
  {
    const memberId = await this.memberIdOf(accountId);
    return !_.isEqual(memberId.raw, new Null());
  }

  async memberIdOf(accountId)
  {
    const decoded = this.keyring.decodeAddress(accountId);
    return await this.api.query.membership.memberIdByAccountId(decoded);
  }

  async createRoleKey(accountId, role)
  {
    role = role || 'storage';

    // Generate new key pair
    const keyPair = util_crypto.naclKeypairFromRandom();

    // Encode to an address.
    const addr = this.keyring.encodeAddress(keyPair.publicKey);
    debug('Generated new key pair with address', addr);

    // Add to key wring. We set the meta to identify the account as
    // a role key.
    const meta = {
      name: `${role} role account for ${accountId}`,
    };

    const createPair = require('@polkadot/keyring/pair').default;
    const pair = createPair('ed25519', keyPair, meta);

    this.keyring.addPair(pair);

    return pair;
  }

  async exportKeyPair(accountId)
  {
    const passphrase = await this.askForPassphrase(accountId);

    // Produce JSON output
    return this.keyring.toJson(accountId, passphrase);
  }

  async writeKeyPairExport(accountId)
  {
    // Generate JSON
    const data = await this.exportKeyPair(accountId);

    // Write JSON
    const filename = `${data.address}.json`;
    fs.writeFileSync(filename, JSON.stringify(data), {
      encoding: 'utf8',
      mode: 0o600,
    });

    return filename;
  }
}

module.exports = {
  IdentitiesApi: IdentitiesApi,
}
