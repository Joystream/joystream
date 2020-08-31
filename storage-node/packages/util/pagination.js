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

const debug = require('debug')('joystream:middleware:pagination')

// Pagination definitions
const apiDefs = {
  parameters: {
    paginationLimit: {
      name: 'limit',
      in: 'query',
      description: 'Number of items per page.',
      required: false,
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 20,
      },
    },
    paginationOffset: {
      name: 'offset',
      in: 'query',
      description: 'Page number (offset)',
      schema: {
        type: 'integer',
        minimum: 0,
      },
    },
  },
  schemas: {
    PaginationInfo: {
      type: 'object',
      required: ['self'],
      properties: {
        self: {
          type: 'string',
        },
        next: {
          type: 'string',
        },
        prev: {
          type: 'string',
        },
        first: {
          type: 'string',
        },
        last: {
          type: 'string',
        },
      },
    },
  },
}

/**
 * Silly pagination because it's faster than getting other modules to work.
 *
 * Usage:
 * - apiDoc.parameters = pagination.parameters
 *   -> Validates pagination parameters
 * - apiDoc.responses.200.schema.pagination = pagination.response
 *   -> Generates pagination info on response
 * - paginate(req, res, [lastOffset])
 *   -> add (valid) pagination fields to response object
 *      If lastOffset is given, create a last link with that offset
 **/
module.exports = {
  // Add pagination parameters and pagination info responses.
  parameters: [
    { $ref: '#/components/parameters/paginationLimit' },
    { $ref: '#/components/parameters/paginationOffset' },
  ],

  response: {
    $ref: '#/components/schema/PaginationInfo',
  },

  // Update swagger/openapi specs with our own parameters and definitions
  openapi(api) {
    api.components = api.components || {}
    api.components.parameters = { ...(api.components.parameters || {}), ...apiDefs.parameters }
    api.components.schemas = { ...(api.components.schemas || {}), ...apiDefs.schemas }
    return api
  },

  // Pagination function
  paginate(req, res, lastOffset) {
    // Skip if the response is not an object.
    if (Object.prototype.toString.call(res) !== '[object Object]') {
      debug('Cannot paginate non-objects.')
      return res
    }

    // Defaults for parameters
    const offset = req.query.offset || 0
    const limit = req.query.limit || 20
    debug('Create pagination links from offset=' + offset, 'limit=' + limit)

    // Parse current url
    const url = require('url')
    // Disable lint because the code (and tests) relied upon obsolete UrlObject. Remove after migration to TypeScript.
    // eslint-disable-next-line node/no-deprecated-api
    const reqUrl = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl)
    const params = new url.URLSearchParams(reqUrl.query)

    // Pagination object
    const pagination = {
      self: reqUrl.href,
    }

    const prev = offset - limit
    if (prev >= 0) {
      params.set('offset', prev)
      reqUrl.search = params.toString()
      pagination.prev = url.format(reqUrl)
    }

    const next = offset + limit
    if (next >= 0) {
      params.set('offset', next)
      reqUrl.search = params.toString()
      pagination.next = url.format(reqUrl)
    }

    if (lastOffset) {
      params.set('offset', lastOffset)
      reqUrl.search = params.toString()
      pagination.last = url.format(reqUrl)
    }

    // First
    params.set('offset', 0)
    reqUrl.search = params.toString()
    pagination.first = url.format(reqUrl)

    debug('pagination', pagination)

    // Now set pagination values in response.
    res.pagination = pagination
    return res
  },
}
