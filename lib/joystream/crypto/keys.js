'use strict';

const { randomBytes } = require('crypto');
const secp256k1 = require('secp256k1');

/*
 * Parse a hexadecimal key, return a Buffer
 */
function parse_hex(key_str)
{
  if (key_str.length % 2) {
    throw new Error('Hex string must be a multiple of 2 in length.');
  }

  var data = key_str;
  if (data[0] == '0' && (data[1] == 'x' || data[1] == 'X')) {
    data = data.slice(2, data.length);
  }

  var ishex = data.match(/^[0-9a-fA-F]+$/);
  if (!ishex) {
    throw new Error('String is not hexadecimal!');
  }

  var buf = Buffer.alloc(data.length / 2);
  for (var buf_i = 0, str_i = 0; str_i < data.length ; buf_i += 1, str_i += 2) {
    var slice = data.slice(str_i, str_i + 2);
    buf[buf_i] = parseInt(slice, 16);
  }

  return buf;
}

/*
 * Creates a key pair, optionally from a seed (secp256k1 private key). If a seed
 * is given and not a Buffer, it is passed through the parse_hex() function.
 */
function key_pair(seed)
{
  var privKey;

  // Have a seed? Try to ensure it's a good private key.
  if (seed) {
    if (seed instanceof Buffer) {
      privKey = seed;
    }
    else {
      privKey = parse_hex(seed);
    }
    if (!secp256k1.privateKeyVerify(privKey)) {
      throw new Error('Seed is not a valid secp256k1 private key!');
    }
  }

  // Don't have a seed? Generate a random private key.
  else {
    do {
      privKey = randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privKey));
  }

  return {
    privKey: privKey,
    pubKey: secp256k1.publicKeyCreate(privKey),
  }
}

module.exports = {
  parse_hex: parse_hex,
  key_pair: key_pair,
};
