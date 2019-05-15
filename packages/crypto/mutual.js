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

const sodium = require('sodium').api;

const { encrypt, decrypt } = require('@joystream/crypto/crypt');

const debug = require('debug')('joystream/crypto/mutual');

/*
 * The function mutates the given buffer in a determinstic fashion. This is
 * used on both ends to verify that the recipient decrypted the challenge:
 * if the sender mutates their unencrypted challenge locally, and the
 * recipient returns the same mutated challenge, it must have been able to
 * decrypt it (and re-encrypt it with the sender's public key).
 *
 * The implementation can vary from use case to use case, as long as its
 * deterministic. We're using a hashing function from sodium here.
 */
function mutate_buffer(buffer)
{
  //console.log('Supposed to mutate', buffer.length, buffer);

  const hash = sodium.crypto_hash(buffer);
  var res;
  if (hash.length > buffer.length) {
    // Truncate hash.
    res = hash.slice(0, buffer.length);
  }
  else if (buffer.length > hash.length) {
    // Pad hash... we do this by filling with zero bytes.
    res = Buffer.alloc(buffer.length, 0x00);
    hash.copy(res);
  }
  //console.log('Mutatated buffer', res.length, res);
  return res;
}

/*
 * Implements mutual authentication, consuming and producing objects with
 * appropriate keys.
 *
 * As the diagram shows, three messages need to be sent for mutual
 * authentication. The boolean flag states whether each side can trust
 * the other side's authenticity.
 *
 * The first message from ALICE is an initial challenge to purported
 * holder of some known public key BOB. The second message proves to the
 * challenger ALIC that the correspondent knows BOB's secret key. The
 * final message proves to BOB that their counterpart knows ALICE's
 * secret key.
 *
 * ALICE                            BOB
 *            initiate
 * false  ---------------------->  false
 *
 *            mutual_challenge
 * true   <----------------------  false
 *
 *            final_response
 * true   ---------------------->  true
 */
class MutualAuthenticator
{
  constructor(own_keypair, peer_pubkey, mutate, options)
  {
    this.NONCE_SIZE = sodium.crypto_box_NONCEBYTES;

    this.options = options || {};
    this.options.challenge_size = this.options.challenge_size || 32;

    this.mutate = mutate || mutate_buffer;

    this.own_keypair = own_keypair;
    this.peer_pubkey = peer_pubkey;

    this.peer_authenticated = false;
  }

  /*
   * Reset the state engine
   */
  reset()
  {
    this.state = {
      expected: undefined,
      peer_pubkey: undefined,
    };
  }

  /*
   * Generate initial state and produce challenge. Must be called only if the
   * peer public key is known.
   */
  initiate()
  {
    if (!this.peer_pubkey) {
      throw new Error('Cannot challenge without knowing a peer public key!');
    }

    this.reset();
    this.state.peer_pubkey = this.peer_pubkey;

    // Generate challenge.
    const challenge = Buffer.allocUnsafe(this.options.challenge_size);
    sodium.randombytes_buf(challenge);
    debug('[A] Generated initial challenge as', challenge.length, challenge);

    // Generate expected buffer.
    this.state.expected = this.mutate(challenge);
    debug('[A] Expected reply is', this.state.expected.length, this.state.expected);

    // Encrypt challenge.
    const encrypted = encrypt(this.own_keypair, this.peer_pubkey, challenge);

    // Add own public key to the result, and pass on.
    const result = {
      publicKey: this.own_keypair.publicKey,
    };
    Object.assign(result, encrypted);
    return result;
  }

  /*
   * Consume initial challenge and send a challenge in response
   */
  mutual_challenge(challenge)
  {
    this.reset();

    // If we know a peer pubkey, it must match the challenge pubkey.
    if (this.peer_pubkey) {
      if (0 != this.peer_pubkey.publicKey.compare(challenge.publicKey)) {
        throw new Error('Challenge public key does not match the expected public key!');
      }
    }

    // Constrcut a peer pubkey in the state. We assume it must be nacl compatible,
    // because otherwise it couldn't have been used to encrypt.
    this.state.peer_pubkey = {
      type: 'ed25519',
      compatibility: 'nacl',
      publicKey: challenge.publicKey,
    };

    // Decrypt challenge.
    const decrypted = decrypt(this.state.peer_pubkey, this.own_keypair, challenge);
    if (!decrypted) {
      throw new Error('Peer sent bad data, aborting!');
    }
    debug('[B] Decrypted initial challenge as', decrypted.length, decrypted);

    // Mutate the buffer once a reply. Mutate it again for the expected reply.
    const reply = this.mutate(decrypted);
    debug('[B] Reply is', reply.length, reply);
    this.state.expected = this.mutate(reply);
    debug('[B] Expected reply to that is', this.state.expected.length, this.state.expected);

    // Encrypt the reply
    const encrypted = encrypt(this.own_keypair, this.state.peer_pubkey, reply);
    return encrypted;
  }

  /*
   * Consue the mutual challenge and generate a final reply.
   */
  final_reply(mutual_challenge)
  {
    // We need to have an expectation of what the challenge contains, otherwise
    // there's an issue.
    if (!this.state || !this.state.expected) {
      throw new Error('State machine is in a bad state, try to reset.');
    }

    // Decrypt the mutual challenge. It should match our own expectations.
    const decrypted = decrypt(this.state.peer_pubkey, this.own_keypair, mutual_challenge);
    if (!decrypted) {
      throw new Error('Peer sent bad data, aborting!');
    }
    debug('[A] Mutual challenge is', decrypted.length, decrypted);

    // Are they matched?
    if (0 != this.state.expected.compare(decrypted)) {
      throw new Error('Could not authenticate peer!');
    }
    this.peer_authenticated = true;
    debug('[A] Peer authenticated.');

    // Ok, so mutate again to prove who we are.
    const mutated = this.mutate(decrypted);
    debug('[A] Final proof is', mutated.length, mutated);

    // And encrypt and send.
    const encrypted = encrypt(this.own_keypair, this.state.peer_pubkey, mutated);
    return encrypted;
  }

  /*
   * Consume the final reply to also authenticate the initiator.
   */
  consume_final(message)
  {
    // We need to have an expectation of what the challenge contains, otherwise
    // there's an issue.
    if (!this.state || !this.state.expected) {
      throw new Error('State machine is in a bad state, try to reset.');
    }

    // Decrypt the mutual challenge. It should match our own expectations.
    const decrypted = decrypt(this.state.peer_pubkey, this.own_keypair, message);
    if (!decrypted) {
      throw new Error('Peer sent bad data, aborting!');
    }
    debug('[B] Final proof is', decrypted.length, decrypted);

    // Are they matched?
    if (0 != this.state.expected.compare(decrypted)) {
      throw new Error('Could not authenticate peer!');
    }
    this.peer_authenticated = true;
    debug('[B] Peer authenticated.');
  }
}


module.exports = {
  MutualAuthenticator: MutualAuthenticator,
}
