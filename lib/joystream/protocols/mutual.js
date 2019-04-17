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

const CryptoMutualAuthenticator = require('joystream/crypto/mutual').MutualAuthenticator;
const { serialize, deserialize } = require('joystream/protocols/util');

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
 *
 * It does little more than serialize the MutualAuthenticator messages from
 * the crypto package.
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

    // Own state - all handled by the internal authenticator.
    const opts = {
      challenge_size: challenge_size,
    };
    this.auth = new CryptoMutualAuthenticator(own_keypair, peer_pubkey, undefined,
      opts);

    const id = own_keypair.publicKey.toString('hex');
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
    this.auth.reset();
    this.state = {
      last_message: undefined,
    };
  }

  /*
   * Return peer authentication state.
   */
  peer_authenticated()
  {
    return this.auth.peer_authenticated;
  }

  /*
   * Initiate the mutual authentication protocol. The callback receives the
   * initial message buffer to send to the peer with the peer_pubkey.
   */
  initiate(cb)
  {
    this.reset();

    // Generate initial challenge
    const challenge = this.auth.initiate();
    this._debug('Initial challenge is', challenge);

    const serialized = serialize([
      this.auth.own_keypair.publicKey,
      challenge.nonce,
      challenge.ciphertext,
    ]);

    this._debug('Message buffer is', serialized.length, serialized);
    this.state.last_message = MSG_CHALLENGE;
    cb(null, MSG_CHALLENGE, serialized);
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

    // Parse message
    const deserialized = deserialize(message);
    const challenge = {
      publicKey: deserialized[0],
      nonce: deserialized[1],
      ciphertext: deserialized[2],
    };
    this._debug('Received challenge', challenge);

    // Let the authenticator handle it.
    var response;
    try {
      response = this.auth.mutual_challenge(challenge);
    } catch (err) {
      cb(err);
      return;
    }
    this._debug('Generated response', response);

    const serialized = serialize([
      response.nonce,
      response.ciphertext,
    ]);

    this._debug('Message buffer is', serialized.length, serialized);
    this.state.last_message = MSG_RESPONSE;
    cb(null, MSG_RESPONSE, serialized);
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

    // Parse message
    const deserialized = deserialize(message);
    const mutual_challenge = {
      nonce: deserialized[0],
      ciphertext: deserialized[1],
    };
    this._debug('Received mutual challenge', mutual_challenge);

    // Let the authenticator handle it.
    var response;
    try {
      response = this.auth.final_reply(mutual_challenge);
    } catch (err) {
      cb(err);
      return;
    }
    this._debug('Generated response', response);

    const serialized = serialize([
      response.nonce,
      response.ciphertext,
    ]);

    this._debug('Message buffer is', serialized.length, serialized);
    this.state.last_message = MSG_FINALIZE;
    cb(null, MSG_FINALIZE, serialized);
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

    // Parse message
    const deserialized = deserialize(message);
    const final_response = {
      nonce: deserialized[0],
      ciphertext: deserialized[1],
    };
    this._debug('Received final response', final_response);

    // Let the authenticator handle it.
    try {
      this.auth.consume_final(final_response);
    } catch (err) {
      cb(err);
      return;
    }
    cb(null);
  }
}

module.exports = {
  MSG_CHALLENGE: MSG_CHALLENGE,
  MSG_RESPONSE: MSG_RESPONSE,
  MSG_FINALIZE: MSG_FINALIZE,
  MutualAuthenticator: MutualAuthenticator,
}
