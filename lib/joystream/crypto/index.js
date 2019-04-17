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

const { Keyring, KEY_TYPES } = require('joystream/crypto/keyring');
const { encrypt, decrypt } = require('joystream/crypto/crypt');
const { MutualAuthenticator } = require('joystream/crypto/mutual');

module.exports = {
  Keyring: Keyring,
  KEY_TYPES: KEY_TYPES,

  encrypt: encrypt,
  decrypt: decrypt,

  MutualAuthenticator: MutualAuthenticator,
}
