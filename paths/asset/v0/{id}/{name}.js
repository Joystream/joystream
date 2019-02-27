'use strict';

const util_ranges = require('joystream/util/ranges');

const debug = require('debug')('joystream:api:asset');

module.exports = function(config, storage)
{
  var doc = {
    // parameters for all operations in this path
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Repository ID',
        schema: {
          type: 'string',
        },
      },
      {
        name: 'name',
        in: 'path',
        required: true,
        description: 'Asset name',
        schema: {
          type: 'string',
        },
      },
    ],

    // Head: report that ranges are OK
    head: function(req, res, _next)
    {
      const id = req.params.id;
      const repo = storage.get(id);
      if (!repo) {
        res.status(404).send({ message: `Repository with id "${id}" not found.` });
        return;
      }

      const name = req.params.name;
      repo.stat(name, true, (err, stats, type) => {
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

    // Put for uploads
    put: function(req, res, _next)
    {
      console.log('GOT REQUEST', req);
      const id = req.params.id;
      const name = req.params.name;

      const repo = storage.get(id);
      if (!repo) {
        res.status(404).send({ message: `Repository with id "${id}" not found.` });
        return;
      }

      // Open file
      repo.open(name, 'w', (err, type, stream) => {
        if (err) {
          res.status(err.code).send({ message: err.message });
          return;
        }

        // XXX Can we do ranges?
//        var opts = {
//          name: name,
//          type: type,
//          ranges: ranges,
//          download: download,
//        };
//        util_ranges.send(res, stream, opts);
        req.on('end', () => {
          res.status(200).send({ message: 'Asset uploaded.' });
        });
        req.pipe(stream);
      });
    },

    // Get content
    get: function(req, res, _next)
    {
      const id = req.params.id;
      const name = req.params.name;
      var download = req.query.download;

      const repo = storage.get(id);
      if (!repo) {
        res.status(404).send({ message: `Repository with id "${id}" not found.` });
        return;
      }

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
      repo.open(name, 'r', (err, type, stream) => {
        if (err) {
          res.status(err.code).send({ message: err.message });
          return;
        }

        var opts = {
          name: name,
          type: type,
          ranges: ranges,
          download: download,
        };
        util_ranges.send(res, stream, opts);
      });
    }
  };

  // OpenAPI specs
  doc.get.apiDoc =
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
        allowEmptyValue: true,
        schema: {
          type: 'boolean',
          default: false,
        },
      },
    ],
    responses: {
      200: {
        description: 'Asset download.',
        content: {
          default: {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: {
              '$ref': '#/components/schemas/Error'
            },
          },
        },
      },
    },
  };

  doc.put.apiDoc =
  {
    description: 'Asset upload.',
    operationId: 'assetUpload',
    tags: ['asset', 'data'],
    requestBody: {
      content: {
        default: {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Asset upload.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['message'],
              properties: {
                message: {
                  type: 'string',
                }
              },
            },
          },
        },
      },
      default: {
        description: 'Unexpected error',
        content: {
          'application/json': {
            schema: {
              '$ref': '#/components/schemas/Error'
            },
          },
        },
      },
    },
  };


  doc.head.apiDoc =
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
        content: {
          'application/json': {
            schema: {
              '$ref': '#/components/schemas/Error'
            },
          },
        },
      },
    },
  };

  return doc;
};


