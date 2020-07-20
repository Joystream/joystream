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

'use strict'

const uuid = require('uuid')
const streamBuf = require('stream-buffers')

const debug = require('debug')('joystream:util:ranges')

/*
 * Range parsing
 */

/*
 * Parse a range string, e.g. '0-100' or '-100' or '0-'. Return the values
 * in an array of int or undefined (if not provided).
 */
function parseRange(range) {
  const matches = range.match(/^(\d+-\d+|\d+-|-\d+|\*)$/u)
  if (!matches) {
    throw new Error(`Not a valid range: ${range}`)
  }

  const vals = matches[1].split('-').map((v) => {
    return v === '*' || v === '' ? undefined : parseInt(v, 10)
  })

  if (vals[1] <= vals[0]) {
    throw new Error(`Invalid range: start "${vals[0]}" must be before end "${vals[1]}".`)
  }

  return [vals[0], vals[1]]
}

/*
 * Parse a range header value, e.g. unit=ranges, where ranges
 * are a comma separated list of individual ranges, and unit is any
 * custom unit string. If the unit (and equal sign) are not given, assume
 * 'bytes'.
 */
function parse(rangeStr) {
  const res = {}
  debug('Parse range header value:', rangeStr)
  const matches = rangeStr.match(/^(([^\s]+)=)?((?:(?:\d+-\d+|-\d+|\d+-),?)+)$/u)
  if (!matches) {
    throw new Error(`Not a valid range header: ${rangeStr}`)
  }

  res.unit = matches[2] || 'bytes'
  res.rangeStr = matches[3]
  res.ranges = []

  // Parse individual ranges
  const ranges = []
  res.rangeStr.split(',').forEach((range) => {
    ranges.push(parseRange(range))
  })

  // Merge ranges into result.
  ranges.forEach((newRange) => {
    debug('Found range:', newRange)

    let isMerged = false
    for (const i in res.ranges) {
      const oldRange = res.ranges[i]

      // Skip if the new range is fully separate from the old range.
      if (oldRange[1] + 1 < newRange[0] || newRange[1] + 1 < oldRange[0]) {
        debug('Range does not overlap with', oldRange)
        continue
      }

      // If we know they're adjacent or overlapping, we construct the
      // merged range from the lower start and the higher end of both
      // ranges.
      const merged = [Math.min(oldRange[0], newRange[0]), Math.max(oldRange[1], newRange[1])]
      res.ranges[i] = merged
      isMerged = true
      debug('Merged', newRange, 'into', oldRange, 'as', merged)
    }

    if (!isMerged) {
      debug('Non-overlapping range!')
      res.ranges.push(newRange)
    }
  })

  // Finally, sort ranges
  res.ranges.sort((first, second) => {
    if (first[0] === second[0]) {
      // Should not happen due to merging.
      return 0
    }
    return first[0] < second[0] ? -1 : 1
  })

  debug('Result of parse is', res)
  return res
}

/*
 * Async version of parse().
 */
function parseAsync(rangeStr, cb) {
  try {
    return cb(parse(rangeStr))
  } catch (err) {
    return cb(null, err)
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
class RangeSender {
  constructor(response, stream, opts, endCallback) {
    // Options
    this.name = opts.name || 'content.bin'
    this.type = opts.type || 'application/octet-stream'
    this.size = opts.size
    this.ranges = opts.ranges
    this.download = opts.download || false

    // Range handling related state.
    this.readOffset = 0 // Nothing read so far
    this.rangeIndex = -1 // No range index yet.
    this.rangeBoundary = undefined // Generate boundary when needed.

    // Event handlers & state
    this.handlers = {}
    this.opened = false

    debug('RangeSender:', this)
    if (opts.ranges) {
      debug('Parsed ranges:', opts.ranges.ranges)
    }

    // Parameters
    this.response = response
    this.stream = stream
    this.opts = opts
    this.endCallback = endCallback
  }

  onError(err) {
    // Assume hiding the actual error is best, and default to 404.
    debug('Error:', err)
    if (!this.response.headersSent) {
      this.response.status(err.code || 404).send({
        message: err.message || `File not found: ${this.name}`,
      })
    }
    if (this.endCallback) {
      this.endCallback(err)
    }
  }

  onEnd() {
    debug('End of stream.')
    this.response.end()
    if (this.endCallback) {
      this.endCallback()
    }
  }

  // **** No ranges
  onOpenNoRange() {
    // File got opened, so we can set headers/status
    debug('Open succeeded:', this.name, this.type)
    this.opened = true

    this.response.status(200)
    this.response.contentType(this.type)
    this.response.header('Accept-Ranges', 'bytes')
    this.response.header('Content-Transfer-Encoding', 'binary')

    if (this.download) {
      this.response.header('Content-Disposition', `attachment; filename="${this.name}"`)
    } else {
      this.response.header('Content-Disposition', 'inline')
    }

    if (this.size) {
      this.response.header('Content-Length', this.size)
    }
  }

  onDataNoRange(chunk) {
    if (!this.opened) {
      this.handlers.open()
    }

    // As simple as it can be.
    this.response.write(Buffer.from(chunk, 'binary'))
  }

  // *** With ranges
  nextRangeHeaders() {
    // Next range
    this.rangeIndex += 1
    if (this.rangeIndex >= this.ranges.ranges.length) {
      debug('Cannot advance range index; we are done.')
      return undefined
    }

    // Calculate this range's size.
    const range = this.ranges.ranges[this.rangeIndex]
    let totalSize
    if (this.size) {
      totalSize = this.size
    }
    if (typeof range[0] === 'undefined') {
      range[0] = 0
    }
    if (typeof range[1] === 'undefined') {
      if (this.size) {
        range[1] = totalSize - 1
      }
    }

    let sendSize
    if (typeof range[0] !== 'undefined' && typeof range[1] !== 'undefined') {
      sendSize = range[1] - range[0] + 1
    }

    // Write headers, but since we may be in a multipart situation, write them
    // explicitly to the stream.
    const start = typeof range[0] === 'undefined' ? '' : `${range[0]}`
    const end = typeof range[1] === 'undefined' ? '' : `${range[1]}`

    let sizeStr
    if (totalSize) {
      sizeStr = `${totalSize}`
    } else {
      sizeStr = '*'
    }

    const ret = {
      'Content-Range': `bytes ${start}-${end}/${sizeStr}`,
      'Content-Type': `${this.type}`,
    }
    if (sendSize) {
      ret['Content-Length'] = `${sendSize}`
    }
    return ret
  }

  nextRange() {
    if (this.ranges.ranges.length === 1) {
      debug('Cannot start new range; only one requested.')
      this.stream.off('data', this.handlers.data)
      return false
    }

    const headers = this.nextRangeHeaders()

    if (headers) {
      const onDataRanges = new streamBuf.WritableStreamBuffer()
      // We start a range with a boundary.
      onDataRanges.write(`\r\n--${this.rangeBoundary}\r\n`)

      // The we write the range headers.
      for (const header in headers) {
        onDataRanges.write(`${header}: ${headers[header]}\r\n`)
      }
      onDataRanges.write('\r\n')
      this.response.write(onDataRanges.getContents())
      debug('New range started.')
      return true
    }

    // No headers means we're finishing the last range.
    this.response.write(`\r\n--${this.rangeBoundary}--\r\n`)
    debug('End of ranges sent.')
    this.stream.off('data', this.handlers.data)
    return false
  }

  onOpenRanges() {
    // File got opened, so we can set headers/status
    debug('Open succeeded:', this.name, this.type)
    this.opened = true

    this.response.header('Accept-Ranges', 'bytes')
    this.response.header('Content-Transfer-Encoding', 'binary')
    this.response.header('Content-Disposition', 'inline')

    // For single ranges, the content length should be the size of the
    // range. For multiple ranges, we don't send a content length
    // header.
    //
    // Similarly, the type is different whether or not there is more than
    // one range.
    if (this.ranges.ranges.length === 1) {
      this.response.writeHead(206, 'Partial Content', this.nextRangeHeaders())
    } else {
      this.rangeBoundary = uuid.v4()
      const headers = {
        'Content-Type': `multipart/byteranges; boundary=${this.rangeBoundary}`,
      }
      this.response.writeHead(206, 'Partial Content', headers)
      this.nextRange()
    }
  }

  onDataRanges(chunk) {
    if (!this.opened) {
      this.handlers.open()
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
    const chunkRange = [this.readOffset, this.readOffset + chunk.length - 1]
    debug('= Got chunk with byte range', chunkRange)
    while (true) {
      let reqRange = this.ranges.ranges[this.rangeIndex]
      if (!reqRange) {
        break
      }
      debug('Current requested range is', reqRange)
      if (!reqRange[1]) {
        reqRange = [reqRange[0], Number.MAX_SAFE_INTEGER]
        debug('Treating as', reqRange)
      }

      // No overlap in the chunk and requested range; don't write.
      if (chunkRange[1] < reqRange[0] || chunkRange[0] > reqRange[1]) {
        debug('Ignoring chunk; it is out of range.')
        break
      }

      // Since there is overlap, find the segment that's entirely within the
      // chunk.
      const segment = [Math.max(chunkRange[0], reqRange[0]), Math.min(chunkRange[1], reqRange[1])]
      debug('Segment to send within chunk is', segment)

      // Normalize the segment to a chunk offset
      const start = segment[0] - this.readOffset
      const end = segment[1] - this.readOffset
      const len = end - start + 1
      debug('Offsets into buffer are', [start, end], 'with length', len)

      // Write the slice that we want to write. We first create a buffer from the
      // chunk. Then we slice a new buffer from the same underlying ArrayBuffer,
      // starting at the original buffer's offset, further offset by the segment
      // start. The segment length bounds the end of our slice.
      const buf = Buffer.from(chunk, 'binary')
      this.response.write(Buffer.from(buf.buffer, buf.byteOffset + start, len))

      // If the requested range is finished, we should start the next one.
      if (reqRange[1] > chunkRange[1]) {
        debug('Chunk is finished, but the requested range is missing bytes.')
        break
      }

      if (reqRange[1] <= chunkRange[1]) {
        debug('Range is finished.')
        if (!this.nextRange(segment)) {
          break
        }
      }
    }

    // Update read offset when chunk is finished.
    this.readOffset += chunk.length
  }

  start() {
    // Before we start streaming, let's ensure our ranges don't contain any
    // without start - if they do, we nuke them all and treat this as a full
    // request.
    let nuke = false
    if (this.ranges) {
      for (const i in this.ranges.ranges) {
        if (typeof this.ranges.ranges[i][0] === 'undefined') {
          nuke = true
          break
        }
      }
    }
    if (nuke) {
      this.ranges = undefined
    }

    // Register callbacks. Store them in a handlers object so we can
    // keep the bound version around for stopping to listen to events.
    this.handlers.error = this.onError.bind(this)
    this.handlers.end = this.onEnd.bind(this)

    if (this.ranges) {
      debug('Preparing to handle ranges.')
      this.handlers.open = this.onOpenRanges.bind(this)
      this.handlers.data = this.onDataRanges.bind(this)
    } else {
      debug('No ranges, just send the whole file.')
      this.handlers.open = this.onOpenNoRange.bind(this)
      this.handlers.data = this.onDataNoRange.bind(this)
    }

    for (const handler in this.handlers) {
      this.stream.on(handler, this.handlers[handler])
    }
  }
}

function send(response, stream, opts, endCallback) {
  const sender = new RangeSender(response, stream, opts, endCallback)
  sender.start()
}

/*
 * Exports
 */

module.exports = {
  parse,
  parseAsync,
  RangeSender,
  send,
}
