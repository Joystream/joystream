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

/*
 * Given nacl-compatible ed25519 keys, encrypt a message buffer. Return
 * the cypher text and nonce.
 */
function encrypt(sender, receiver, message)
{
  if (sender.type === 'sr25519') {
    throw new Error('Bad sender, cannot use schnorrkel.');
  }
  if (receiver.type === 'sr25519') {
    throw new Error('Bad receiver, cannot use schnorrkel.');
  }

  if (sender.compatibility !== 'nacl') {
    throw new Error('Bad sender, key must be NaCl compatible.');
  }
  if (receiver.compatibility !== 'nacl') {
    throw new Error('Bad receiver, key must be NaCl compatible.');
  }

  if (typeof message === 'string') {
    message = Buffer.from(message);
  }

  const nonce = Buffer.allocUnsafe(sodium.crypto_box_NONCEBYTES);
  sodium.randombytes_buf(nonce);

  const ciphertext = sodium.crypto_box(message, nonce, receiver.publicKey, sender.secretKey);
  return {
    nonce: nonce,
    ciphertext: ciphertext,
  };
}

/*
 * Given nacl-compatible ed25519 keys, decrypt a message buffer. Requires a
 * nonce. Return the plain text.
 */
function decrypt(sender, receiver, ciphertext, nonce)
{
  if (sender.type === 'sr25519') {
    throw new Error('Bad sender, cannot use schnorrkel.');
  }
  if (receiver.type === 'sr25519') {
    throw new Error('Bad receiver, cannot use schnorrkel.');
  }

  if (sender.compatibility !== 'nacl') {
    throw new Error('Bad sender, key must be NaCl compatible.');
  }
  if (receiver.compatibility !== 'nacl') {
    throw new Error('Bad receiver, key must be NaCl compatible.');
  }

  if (!nonce) {
    nonce = ciphertext.nonce;
    ciphertext = ciphertext.ciphertext;
  }

  if (typeof ciphertext === 'string') {
    ciphertext = Buffer.from(ciphertext);
  }

  return sodium.crypto_box_open(ciphertext, nonce, sender.publicKey, receiver.secretKey);
}


module.exports = {
  encrypt: encrypt,
  decrypt: decrypt,
}
