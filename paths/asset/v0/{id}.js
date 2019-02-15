'use strict';

const storage = require.main.require('joystream/storage');
const util_ranges = require.main.require('util/ranges');

const debug = require('debug')('joystream:api:asset');

module.exports = {
  // parameters for all operations in this path
  parameters: [
    {
      name: 'id',
      in: 'path',
      type: 'string',
      required: true,
      description: 'Asset ID'
    },
  ],

  // Head: report that ranges are OK
  head: function(req, res, _next)
  {
    const id = req.params.id;
    // FIXME: get path from configuration, don't hardcode.
    var store = new storage.Storage('./storage');

    store.stat(id, true, (stats, type, err) => {
      if (err) {
        res.status(err.code).send({ message: err.message });
        return;
      }

      res.status(200);
      res.contentType(type);
      res.header('Content-Disposition', 'inline');
      res.header('Content-Transfer-Encoding', 'binary');
      res.header('Accept-Ranges', 'bytes');
      if (stats && stats.size > 0) {
        res.header('Content-Length', stats.size);
      }
      res.send();
    });
  },

  // Get content
  get: function(req, res, _next)
  {
    const id = req.params.id;
    // FIXME: get path from configuration, don't hardcode.
    var store = new storage.Storage('./storage');
    var download = req.query.download;

    // Parse range header
    var ranges;
    if (!download) {
      try {
        var range_header = req.headers['range'];
        ranges = util_ranges.parse(range_header);
      } catch (err) {
        // Do nothing; it's ok to ignore malformed ranges and respond with the
        // full content according to https://www.rfc-editor.org/rfc/rfc7233.txt
      }
      if (ranges && ranges.unit != 'bytes') {
        // Ignore ranges that are not byte units.
        ranges = undefined;
      }
    }
    debug('Requested range(s) is/are', ranges);

    // Open file
    store.open(id, 'r', (type, stream, err) => {
      if (err) {
        res.status(err.code).send({ message: err.message });
        return;
      }

      var opts = {
        name: id,
        type: type,
        ranges: ranges,
        download: download,
      };
      util_ranges.send(res, stream, opts);
    });
  }
};

// OpenAPI specs
module.exports.get.apiDoc =
{
  description: 'Download an asset.',
  operationId: 'assetData',
  tags: ['asset', 'data'],
  parameters: [
    {
      name: 'download',
      in: 'query',
      description: 'Download instead of streaming inline.',
      required: false,
      type: 'boolean',
      allowEmptyValue: true,
      default: false,
    },
  ],
  responses: {
    200: {
      description: 'Asset download.',
      schema: {
        type: 'string',
        format: 'binary',
      },
    },
    default: {
      description: 'Unexpected error',
      schema: {
        '$ref': '#/definitions/Error'
      }
    }
  }
};


module.exports.head.apiDoc =
{
  description: 'Asset download information.',
  operationId: 'assetInfo',
  tags: ['asset', 'metadata'],
  responses: {
    200: {
      description: 'Asset info.',
    },
    default: {
      description: 'Unexpected error',
      schema: {
        '$ref': '#/definitions/Error'
      }
    }
  }
};
