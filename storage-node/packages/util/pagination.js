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

const debug = require('debug')('joystream:middleware:pagination');

// Pagination definitions
const _api_defs = {
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
        'self': {
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
};

/**
 * Silly pagination because it's faster than getting other modules to work.
 *
 * Usage:
 * - apiDoc.parameters = pagination.parameters
 *   -> Validates pagination parameters
 * - apiDoc.responses.200.schema.pagination = pagination.response
 *   -> Generates pagination info on response
 * - paginate(req, res, [last_offset])
 *   -> add (valid) pagination fields to response object
 *      If last_offset is given, create a last link with that offset
 **/
module.exports = {

  // Add pagination parameters and pagination info responses.
  parameters: [
    { '$ref': '#/components/parameters/paginationLimit' },
    { '$ref': '#/components/parameters/paginationOffset' },

  ],

  response: {
    '$ref': '#/components/schema/PaginationInfo'
  },

  // Update swagger/openapi specs with our own parameters and definitions
  openapi: function(api)
  {
    api.components = api.components || {};
    api.components.parameters = { ...api.components.parameters || {} , ..._api_defs.parameters };
    api.components.schemas = { ...api.components.schemas || {}, ..._api_defs.schemas };
    return api;
  },

  // Pagination function
  paginate: function(req, res, last_offset)
  {
    // Skip if the response is not an object.
    if (Object.prototype.toString.call(res) != "[object Object]") {
      debug('Cannot paginate non-objects.');
      return res;
    }

    // Defaults for parameters
    var offset = req.query.offset || 0;
    var limit = req.query.limit || 20;
    debug('Create pagination links from offset=' + offset, 'limit=' + limit);

    // Parse current url
    const url = require('url');
    var req_url = url.parse(req.protocol + '://' + req.get('host') + req.originalUrl);
    var params = new url.URLSearchParams(req_url.query);

    // Pagination object
    var pagination = {
      'self': req_url.href,
    }

    var prev = offset - limit;
    if (prev >= 0) {
      params.set('offset', prev);
      req_url.search = params.toString();
      pagination['prev'] = url.format(req_url);

    }

    var next = offset + limit;
    if (next >= 0) {
      params.set('offset', next);
      req_url.search = params.toString();
      pagination['next'] = url.format(req_url);
    }

    if (last_offset) {
      params.set('offset', last_offset);
      req_url.search = params.toString();
      pagination['last'] = url.format(req_url);
    }

    // First
    params.set('offset', 0);
    req_url.search = params.toString();
    pagination['first'] = url.format(req_url);

    debug('pagination', pagination);

    // Now set pagination values in response.
    res.pagination = pagination;
    return res;
  },
};
