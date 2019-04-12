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

const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');
const secp256k1 = require('secp256k1');

const debug = require('debug')('joystream::protocols:mutual');

const CHALLENGE_CIPHER = 'aes-256-cfb';
const CHALLENGE_CIPHER_IV_SIZE = 16;

const MSG_CHALLENGE = 0x00;
const MSG_RESPONSE  = 0x01;
const MSG_FINALIZE  = 0x02;

const RESERVED_MESSAGE_SLOTS = 10;

/*
 * MutualAuthenticator is a protocol class, maintaining protocol state for
 * mutually authenticating two nodes.
 * Since secpk256k1 gives us an ECDH key exchange, and a successful exchange
 * implies the other party holds the private key associated with the pubkey
 * they're advertising, authentication is assured when the exchange worked.
 * For that, some random challenge needs to be transmitted and decoded
 * properly.
 */
class MutualAuthenticator
{
  constructor(own_keypair, peer_pubkey, challenge_size)
  {
    // The protocol for merging multiple protocol implementations is that
    // the range contains the message code for the lowest and the highest
    // reserved messages. RESERVED_MESSAGE_SLOTS must be decremented for each
    // message code added.
    this.PROTO_NAME = 'MutualAuthenticator';
    this.MESSAGE_RANGE = [MSG_CHALLENGE, MSG_FINALIZE + RESERVED_MESSAGE_SLOTS];

    // Own state
    this.own_keypair = own_keypair;
    this.peer_pubkey = peer_pubkey;
    this.challenge_size = challenge_size || 32;
    this.peer_authenticated = false;

    const id = own_keypair.pubKey.toString('hex'); 
    this.id = `${id.slice(0, 6)}...${id.slice(id.length - 6, id.length)}`;
    debug('Initialized', id, 'as', this.id);

    this.handlers = {};
    this.handlers[MSG_CHALLENGE] = this.handle_challenge.bind(this);
    this.handlers[MSG_RESPONSE]  = this.handle_response.bind(this);
    this.handlers[MSG_FINALIZE]  = this.handle_finalize.bind(this);

    this.reset();
  }

  _debug()
  {
    var args = Array.prototype.slice.apply(arguments);
    args.unshift(`[${this.id}]`);
    debug.apply(this, args);
  }

  /*
   * Reset the state engine
   */
  reset()
  {
    this.state = {
      secret: undefined,
      iv: undefined,
      challenge: undefined,
      last_message: undefined,
    };
  }

  /*
   * Initiate the mutual authentication protocol. The callback receives the
   * initial message buffer to send to the peer with the peer_pubkey.
   */
  initiate(cb)
  {
    // Initiation means reset
    this.reset();

    // Generate ECDH secret
    this.state.secret = secp256k1.ecdh(this.peer_pubkey, this.own_keypair.privKey);
    this._debug('Initialized with secret', this.state.secret.length, this.state.secret);

    // Generate IV and challenge
    this.state.iv = randomBytes(CHALLENGE_CIPHER_IV_SIZE);
    this._debug('IV is', this.state.iv.length, this.state.iv);
    this.state.challenge = randomBytes(this.challenge_size);
    this._debug('Challenge is', this.state.challenge.length, this.state.challenge);

    // Encrypt challenge with secret key.
    const cipher = createCipheriv(CHALLENGE_CIPHER, this.state.secret, this.state.iv);
    const crypted = cipher.update(this.state.challenge);
    this._debug('Crypted challenge is', crypted.length, crypted);

    // The initial message consists of:
    const msg_size = CHALLENGE_CIPHER_IV_SIZE // The IV; fixed length.
      + 2                               // The length of our own public key
      + this.own_keypair.pubKey.length  // Our own public key.
      + 2                               // The length of the encrypted challenge
      + crypted.length                  // The encrypted challenge.
    const msg = Buffer.alloc(msg_size);

    // IV
    var offset = 0;
    this.state.iv.copy(msg, offset, 0, CHALLENGE_CIPHER_IV_SIZE);
    offset += CHALLENGE_CIPHER_IV_SIZE;

    // Public key
    const pubkey = this.own_keypair.pubKey;
    this._debug('Encode pubkey as', pubkey);
    msg[offset++] = parseInt(pubkey.length / 256, 10);
    msg[offset++] = parseInt(pubkey.length % 256, 10);
    this.own_keypair.pubKey.copy(msg, offset, 0, pubkey.length);
    offset += pubkey.length;

    // Challenge length - network byte order is big endian
    msg[offset++] = parseInt(crypted.length / 256, 10);
    msg[offset++] = parseInt(crypted.length % 256, 10);
    crypted.copy(msg, offset, 0, crypted.length);

    this._debug('Message buffer is', msg_size, msg);
    this.state.last_message = MSG_CHALLENGE;
    cb(null, MSG_CHALLENGE, msg);
  }

  /*
   * Consume a message buffer, and make update the protocol state.
   */
  consume(message_type, message, cb)
  {
    // Handle each message differently.
    this._debug('Received message of type', message_type);

    const handler = this.handlers[message_type]
    if (!handler) {
      cb(new Error('Unknown message type', message_type));
      return;
    }

    handler(message, cb);
  }

  /*
   * Handle challenge messages
   */
  handle_challenge(message, cb)
  {
    this._debug('Handling challenge', message);
    if (this.state.last_message) {
      this._debug('We are in the middle of another exchange; resetting state.');
      this.reset();
    }
    this.state.last_message = MSG_CHALLENGE;

    // Parse IV out of message buffer
    var offset = 0;
    this.state.iv = Buffer.alloc(CHALLENGE_CIPHER_IV_SIZE);
    message.copy(this.state.iv, 0, offset, offset + CHALLENGE_CIPHER_IV_SIZE);
    offset += CHALLENGE_CIPHER_IV_SIZE;
    this._debug('Received IV of', this.state.iv.length, this.state.iv);

    // Parse public key out of message buffer
    const pubkey_size = message[offset] * 256 + message[offset + 1];
    offset += 2;
    this._debug('Pubkey size is', pubkey_size);
    const pubkey = Buffer.alloc(pubkey_size);
    message.copy(pubkey, 0, offset, offset + pubkey_size);
    offset += pubkey_size;
    this._debug('Got pubkey as', pubkey);

    // Check peer public key.
    if (this.peer_pubkey) {
      if (0 != this.peer_pubkey.compare(pubkey)) {
        cb(new Error('Got a peer public key that does not match our expecation!'));
        return;
      }
    }
    this.peer_pubkey = pubkey;

    // Generate secret
    this.state.secret = secp256k1.ecdh(this.peer_pubkey, this.own_keypair.privKey);
    this._debug('Initialized with secret', this.state.secret.length, this.state.secret);

    // Handle challenge
    const res = this._challenge_response(message, this.state.iv, offset, MSG_RESPONSE, 1);
    this.state.challenge = res[0];
    this.state.last_message = MSG_RESPONSE;
    cb(null, MSG_RESPONSE, res[1]);
  }

  /*
   * Handle challenge response messages
   */
  handle_response(message, cb)
  {
    this._debug('Handling response', message);
    if (typeof this.state.last_message === 'undefined') {
      cb(new Error('Bad state; mutual authentication not yet initiated!'));
      return;
    }

    if (this.state.last_message != MSG_CHALLENGE) {
      cb(new Error('Bad state; expected to have only sent a challenge so far.'));
      return;
    }
    this.state.last_message = MSG_FINALIZE;

    // Mutate IV
    const iv = this.mutate('Response IV', this.state.iv, 1);

    // The response should be to mutate again, but with a new step.
    const res = this._challenge_response(message, iv, 0, MSG_FINALIZE, 2);

    // The mutated challenge should be reconstructable by us. If it
    // matches what we reconstruct, then on our end we're authenticated.
    const reconstructed = this.mutate('reconstructed', this.state.challenge, 1);
    this._debug('Reconstructed', reconstructed);
    this._debug('Received', res[0]);
    if (0 != reconstructed.compare(res[0])) {
      cb(new Error('Cannot authenticate peer!'));
      return;
    }
    this.peer_authenticated = true;

    this.state.last_message = MSG_FINALIZE;
    cb(null, MSG_FINALIZE, res[1]);
  }

  /*
   * Handle finalize messages
   */
  handle_finalize(message, cb)
  {
    this._debug('Handling finalize', message);
    if (typeof this.state.last_message === 'undefined') {
      cb(new Error('Bad state; mutual authentication not yet initiated!'));
      return;
    }

    if (this.state.last_message != MSG_RESPONSE) {
      cb(new Error('Bad state; expected to have sent a response so far.'));
      return;
    }
    this.state.last_message = MSG_FINALIZE;

    // Mutate IV
    const iv = this.mutate('Response IV', this.state.iv, 2);

    // The response should be to mutate again, but with a new step.
    const res = this._challenge_response(message, iv, 0);

    // The mutated challenge should be reconstructable by us. If it
    // matches what we reconstruct, then on our end we're authenticated.
    var reconstructed = this.mutate('reconstructed', this.state.challenge, 1);
    reconstructed = this.mutate('reconstructed', reconstructed, 2);
    this._debug('Reconstructed', reconstructed);
    this._debug('Received', res[0]);
    if (0 != reconstructed.compare(res[0])) {
      cb(new Error('Cannot authenticate peer!'));
      return;
    }
    this.peer_authenticated = true;

    cb(null);
  }


  /*
   * Common code between response and finalizing messages.
   */
  _challenge_response(message, decrypt_iv, offset, next_message, mutate_step)
  {
    // Parse crypted challenge out of IV.
    const crypted_size = message[offset] * 256 + message[offset + 1];
    offset += 2;
    this._debug('Crypted size is', crypted_size);
    const crypted = Buffer.alloc(crypted_size);
    message.copy(crypted, 0, offset, offset + crypted_size);
    this._debug('Received crypted challenge', crypted);

    // Decrypt challenge.
    const decipher = createDecipheriv(CHALLENGE_CIPHER, this.state.secret, decrypt_iv);
    const challenge = decipher.update(crypted);
    this._debug('Recovered challenge', challenge.length, challenge);

    var mutated;
    var msg;
    if (next_message) {
      // For the response, we mutate the challenge, then re-encrypt and send it.
      mutated = this.mutate('challenge', challenge, mutate_step);

      // Encrypt the mutated challenge. We mutate the IV in the same way.
      const iv = this.mutate('challenge IV', this.state.iv, mutate_step);
      const cipher = createCipheriv(CHALLENGE_CIPHER, this.state.secret, iv);
      const crypted2 = cipher.update(mutated);
      this._debug('Crypted response challenge is', crypted2);

      // The message to return is simpler than the challenge message, because
      // we can reconstruct the IV on the other side.
      const msg_size = 2            // The length of the encrypted challenge
        + crypted2.length           // The encrypted response challenge.
      msg = Buffer.alloc(msg_size);

      // Challenge length - network byte order is big endian
      var offset = 0;
      msg[offset++] = parseInt(crypted2.length / 256, 10);
      msg[offset++] = parseInt(crypted2.length % 256, 10);

      // Copy crypted response challenge
      crypted2.copy(msg, offset, 0, crypted2.length);

      this._debug('Message buffer is', msg_size, msg);
    }

    return [challenge, msg];
  }


  /*
   * Mutate the passed buffer in one of two steps.
   * - In the first step, we pick an offset into the challenge, and increment
   *   this byte by one, accounting for overlow. The offset we use is the first
   *   byte of the buffer, clamped to the size of the buffer.
   * - In the second step, take the byte modified in the first step as the
   *   offset and do the same thing.
   *
   * Mutating what was received in a predictable way and sending it back
   * proves that we correctly decrypted the value.
   */
  mutate(name, buffer, step)
  {
    const result = Buffer.alloc(buffer.length);
    buffer.copy(result);

    this._debug(name, 'prior to mutation', result);
    var offset;
    if (step == 1) {
      offset = buffer[0] % buffer.length;
      result[offset] += 1;
      this._debug(name, 'after step 1 @', offset, result);
    }

    if (step == 2) {
      offset = buffer[0] % buffer.length;
      offset = result[offset] % result.length;
      result[offset] += 1;
      this._debug(name, 'after step 2 @', offset, result);
    }
    return result;
  }
}

module.exports = {
  MSG_CHALLENGE: MSG_CHALLENGE,
  MSG_RESPONSE: MSG_RESPONSE,
  MSG_FINALIZE: MSG_FINALIZE,
  MutualAuthenticator: MutualAuthenticator,
}
