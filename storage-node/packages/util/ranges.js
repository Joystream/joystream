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

const uuid = require('uuid');
const stream_buf = require('stream-buffers');

const debug = require('debug')('joystream:util:ranges');

/*
 * Range parsing
 */

/*
 * Parse a range string, e.g. '0-100' or '-100' or '0-'. Return the values
 * in an array of int or undefined (if not provided).
 */
function _parse_range(range)
{
  var matches = range.match(/^(\d+-\d+|\d+-|-\d+|\*)$/u);
  if (!matches) {
    throw new Error(`Not a valid range: ${range}`);
  }

  var vals = matches[1].split('-').map((v) => {
    return v === '*' || v === '' ? undefined : parseInt(v, 10);
  });

  if (vals[1] <= vals[0]) {
    throw new Error(`Invalid range: start "${vals[0]}" must be before end "${vals[1]}".`);
  }

  return [vals[0], vals[1]];
}


/*
 * Parse a range header value, e.g. unit=ranges, where ranges
 * are a comman separated list of individual ranges, and unit is any
 * custom unit string. If the unit (and equal sign) are not given, assume
 * 'bytes'.
 */
function parse(range_str)
{
  var res = {};
  debug('Parse range header value:', range_str);
  var matches = range_str.match(/^(([^\s]+)=)?((?:(?:\d+-\d+|-\d+|\d+-),?)+)$/u)
  if (!matches) {
    throw new Error(`Not a valid range header: ${range_str}`);
  }

  res.unit = matches[2] || 'bytes';
  res.range_str = matches[3];
  res.ranges = [];

  // Parse individual ranges
  var ranges = []
  res.range_str.split(',').forEach((range) => {
    ranges.push(_parse_range(range));
  });

  // Merge ranges into result.
  ranges.forEach((new_range) => {
    debug('Found range:', new_range);

    var is_merged = false;
    for (var i in res.ranges) {
      var old_range = res.ranges[i];

      // Skip if the new range is fully separate from the old range.
      if (old_range[1] + 1 < new_range[0] || new_range[1] + 1 < old_range[0]) {
        debug('Range does not overlap with', old_range);
        continue;
      }

      // If we know they're adjacent or overlapping, we construct the
      // merged range from the lower start and the higher end of both
      // ranges.
      var merged = [
        Math.min(old_range[0], new_range[0]),
        Math.max(old_range[1], new_range[1])
      ];
      res.ranges[i] = merged;
      is_merged = true;
      debug('Merged', new_range, 'into', old_range, 'as', merged);
    }

    if (!is_merged) {
      debug('Non-overlapping range!');
      res.ranges.push(new_range);
    }
  });

  // Finally, sort ranges
  res.ranges.sort((first, second) => {
    if (first[0] === second[0]) {
      // Should not happen due to merging.
      return 0;
    }
    return (first[0] < second[0]) ? -1 : 1;
  });

  debug('Result of parse is', res);
  return res;
}


/*
 * Async version of parse().
 */
function parseAsync(range_str, cb)
{
  try {
    return cb(parse(range_str));
  } catch (err) {
    return cb(null, err);
  }
}


/*
 * Range streaming
 */

/*
 * The class writes parts specified in the options to the response. If no ranges
 * are specified, the entire stream is written. At the end, the given callback
 * is invoked - if an error occurred, it is invoked with an error parameter.
 *
 * Note that the range implementation can be optimized for streams that support
 * seeking.
 *
 * There's another optimization here for when sizes are given, which is possible
 * with file system based streams. We'll see how likely that's going to be in
 * future.
 */
class RangeSender
{
  constructor(response, stream, opts, end_callback)
  {
    // Options
    this.name = opts.name || 'content.bin';
    this.type = opts.type || 'application/octet-stream';
    this.size = opts.size;
    this.ranges = opts.ranges;
    this.download = opts.download || false;

    // Range handling related state.
    this.read_offset = 0;             // Nothing read so far
    this.range_index = -1;            // No range index yet.
    this.range_boundary = undefined;  // Generate boundary when needed.

    // Event handlers & state
    this.handlers = {};
    this.opened = false;

    debug('RangeSender:', this);
    if (opts.ranges) {
      debug('Parsed ranges:', opts.ranges.ranges);
    }

    // Parameters
    this.response = response;
    this.stream = stream;
    this.opts = opts;
    this.end_callback = end_callback;
  }

  on_error(err)
  {
    // Assume hiding the actual error is best, and default to 404.
    debug('Error:', err);
    if (!this.response.headersSent) {
      this.response.status(err.code || 404).send({
        message: err.message || `File not found: ${this.name}`
      });
    }
    if (this.end_callback) {
      this.end_callback(err);
    }
  }

  on_end()
  {
    debug('End of stream.');
    this.response.end();
    if (this.end_callback) {
      this.end_callback();
    }
  }


  // **** No ranges
  on_open_no_range()
  {
    // File got opened, so we can set headers/status
    debug('Open succeeded:', this.name, this.type);
    this.opened = true;

    this.response.status(200);
    this.response.contentType(this.type);
    this.response.header('Accept-Ranges', 'bytes');
    this.response.header('Content-Transfer-Encoding', 'binary');

    if (this.download) {
      this.response.header('Content-Disposition', `attachment; filename="${this.name}"`);
    }
    else {
      this.response.header('Content-Disposition', 'inline');
    }

    if (this.size) {
      this.response.header('Content-Length', this.size);
    }
  }


  on_data_no_range(chunk)
  {
    if (!this.opened) {
      this.handlers['open']();
    }

    // As simple as it can be.
    this.response.write(Buffer.from(chunk, 'binary'));
  }

  // *** With ranges
  next_range_headers()
  {
    // Next range
    this.range_index += 1;
    if (this.range_index >= this.ranges.ranges.length) {
      debug('Cannot advance range index; we are done.');
      return undefined;
    }

    // Calculate this range's size.
    var range = this.ranges.ranges[this.range_index];
    var total_size;
    if (this.size) {
      total_size = this.size;
    }
    if (typeof range[0] === 'undefined') {
      range[0] = 0;
    }
    if (typeof range[1] === 'undefined') {
      if (this.size) {
        range[1] = total_size - 1;
      }
    }

    var send_size;
    if (typeof range[0] !== 'undefined' && typeof range[1] !== 'undefined') {
      send_size = range[1] - range[0] + 1;
    }

    // Write headers, but since we may be in a multipart situation, write them
    // explicitly to the stream.
    var start = (typeof range[0] === 'undefined') ? '' : `${range[0]}`;
    var end = (typeof range[1] === 'undefined') ? '' : `${range[1]}`;

    var size_str;
    if (total_size) {
      size_str = `${total_size}`;
    }
    else {
      size_str = '*';
    }

    var ret = {
      'Content-Range': `bytes ${start}-${end}/${size_str}`,
      'Content-Type': `${this.type}`,
    };
    if (send_size) {
      ret['Content-Length'] = `${send_size}`;
    }
    return ret;
  }


  next_range()
  {
    if (this.ranges.ranges.length == 1) {
      debug('Cannot start new range; only one requested.');
      this.stream.off('data', this.handlers['data']);
      return false;
    }

    var headers = this.next_range_headers();

    if (headers) {
      var header_buf = new stream_buf.WritableStreamBuffer();
      // We start a range with a boundary.
      header_buf.write(`\r\n--${this.range_boundary}\r\n`);

      // The we write the range headers.
      for (var header in headers) {
        header_buf.write(`${header}: ${headers[header]}\r\n`);
      }
      header_buf.write('\r\n');
      this.response.write(header_buf.getContents());
      debug('New range started.');
      return true;
    }

    // No headers means we're finishing the last range.
    this.response.write(`\r\n--${this.range_boundary}--\r\n`);
    debug('End of ranges sent.');
    this.stream.off('data', this.handlers['data']);
    return false;
  }


  on_open_ranges()
  {
    // File got opened, so we can set headers/status
    debug('Open succeeded:', this.name, this.type);
    this.opened = true;

    this.response.header('Accept-Ranges', 'bytes');
    this.response.header('Content-Transfer-Encoding', 'binary');
    this.response.header('Content-Disposition', 'inline');

    // For single ranges, the content length should be the size of the
    // range. For multiple ranges, we don't send a content length
    // header.
    //
    // Similarly, the type is different whether or not there is more than
    // one range.
    if (this.ranges.ranges.length == 1) {
      this.response.writeHead(206, 'Partial Content', this.next_range_headers());
    }
    else {
      this.range_boundary = uuid.v4();
      var headers = {
        'Content-Type': `multipart/byteranges; boundary=${this.range_boundary}`,
      };
      this.response.writeHead(206, 'Partial Content', headers);
      this.next_range();
    }
  }

  on_data_ranges(chunk)
  {
    if (!this.opened) {
      this.handlers['open']();
    }
    // Crap, node.js streams are stupid. No guarantee for seek support. Sure,
    // that makes node.js easier to implement, but offloads everything onto the
    // application developer.
    //
    // So, we skip chunks until our read position is within the range we want to
    // send at the moment. We're relying on ranges being in-order, which this
    // file's parser luckily (?) provides.
    //
    // The simplest optimization would be at ever range start to seek() to the
    // start.
    var chunk_range = [this.read_offset, this.read_offset + chunk.length - 1];
    debug('= Got chunk with byte range', chunk_range);
    while (true) {
      var req_range = this.ranges.ranges[this.range_index];
      if (!req_range) {
        break;
      }
      debug('Current requested range is', req_range);
      if (!req_range[1]) {
        req_range = [req_range[0], Number.MAX_SAFE_INTEGER];
        debug('Treating as', req_range);
      }

      // No overlap in the chunk and requested range; don't write.
      if (chunk_range[1] < req_range[0] || chunk_range[0] > req_range[1]) {
        debug('Ignoring chunk; it is out of range.');
        break;
      }

      // Since there is overlap, find the segment that's entirely within the
      // chunk.
      var segment = [
        Math.max(chunk_range[0], req_range[0]),
        Math.min(chunk_range[1], req_range[1]),
      ];
      debug('Segment to send within chunk is', segment);

      // Normalize the segment to a chunk offset
      var start = segment[0] - this.read_offset;
      var end = segment[1] - this.read_offset;
      var len = end - start + 1;
      debug('Offsets into buffer are', [start, end], 'with length', len);

      // Write the slice that we want to write. We first create a buffer from the
      // chunk. Then we slice a new buffer from the same underlying ArrayBuffer,
      // starting at the original buffer's offset, further offset by the segment
      // start. The segment length bounds the end of our slice.
      var buf = Buffer.from(chunk, 'binary');
      this.response.write(Buffer.from(buf.buffer, buf.byteOffset + start, len));

      // If the requested range is finished, we should start the next one.
      if (req_range[1] > chunk_range[1]) {
        debug('Chunk is finished, but the requested range is missing bytes.');
        break;
      }

      if (req_range[1] <= chunk_range[1]) {
        debug('Range is finished.');
        if (!this.next_range(segment)) {
          break;
        }
      }
    }

    // Update read offset when chunk is finished.
    this.read_offset += chunk.length;
  }


  start()
  {
    // Before we start streaming, let's ensure our ranges don't contain any
    // without start - if they do, we nuke them all and treat this as a full
    // request.
    var nuke = false;
    if (this.ranges) {
      for (var i in this.ranges.ranges) {
        if (typeof this.ranges.ranges[i][0] === 'undefined') {
          nuke = true;
          break;
        }
      }
    }
    if (nuke) {
      this.ranges = undefined;
    }

    // Register callbacks. Store them in a handlers object so we can
    // keep the bound version around for stopping to listen to events.
    this.handlers['error'] = this.on_error.bind(this);
    this.handlers['end'] = this.on_end.bind(this);

    if (this.ranges) {
      debug('Preparing to handle ranges.');
      this.handlers['open'] = this.on_open_ranges.bind(this);
      this.handlers['data'] = this.on_data_ranges.bind(this);
    }
    else {
      debug('No ranges, just send the whole file.');
      this.handlers['open'] = this.on_open_no_range.bind(this);
      this.handlers['data'] = this.on_data_no_range.bind(this);
    }

    for (var handler in this.handlers) {
      this.stream.on(handler, this.handlers[handler]);
    }
  }
}


function send(response, stream, opts, end_callback)
{
  var sender = new RangeSender(response, stream, opts, end_callback);
  sender.start();
}


/*
 * Exports
 */

module.exports =
{
  parse: parse,
  parseAsync: parseAsync,
  RangeSender: RangeSender,
  send: send,
};
