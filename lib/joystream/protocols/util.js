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

const MAX_ENTITY_SIZE = 1024;

/*
 * Add a length encoded buffer to the target. This means writing first two bytes
 * containing the buffer length, then the buffer to the target.
 * Pass an optional target offset, and returns the new offset for a subsequent
 * write operation.
 */
function write_buffer(target, buffer, offset)
{
  target[offset++] = parseInt(buffer.length / 256, 10);
  target[offset++] = parseInt(buffer.length % 256, 10);
  buffer.copy(target, offset, 0, buffer.length);
  offset += buffer.length;
  return offset;
}

/*
 * Similar to write_buffer; returns a new buffer read from the offset as well
 * as a new offset.
 */
function read_buffer(source, offset)
{
  const size = source[offset] * 256 + source[offset + 1];
  if (size > MAX_ENTITY_SIZE) {
    throw new Error('Asked to allocate too much for a single entity.');
  }
  offset += 2;

  const result = Buffer.allocUnsafe(size);
  source.copy(result, 0, offset, offset + size);
  offset += size;
  return {
    offset: offset,
    data: result,
  };
}

/*
 * Serialize multiple buffers in sequence.
 */
function serialize(buffers)
{
  // Calculate total size.
  var total_size = 0;
  for (var i = 0 ; i < buffers.length ; ++i) {
    total_size += 2 + buffers[i].length;
  }

  // Allocate buffer
  const result = Buffer.allocUnsafe(total_size);

  // Serialize all
  var offset = 0;
  for (var i = 0 ; i < buffers.length ; ++i) {
    offset = write_buffer(result, buffers[i], offset);
  }

  return result;
}

/*
 * Deserialize into multiple buffers.
 */
function deserialize(source)
{
  const result = [];

  var offset = 0;
  while (offset < source.length) {
    var { data, offset } = read_buffer(source, offset);
    result.push(data);
  }

  return result;
}


module.exports = {
  read_buffer: read_buffer,
  write_buffer: write_buffer,
  serialize: serialize,
  deserialize: deserialize,
}
