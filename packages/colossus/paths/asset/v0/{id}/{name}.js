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

const path = require('path');

const file_type = require('file-type');
const mime_types = require('mime-types');

const debug = require('debug')('joystream:api:asset');

const util_ranges = require('joystream/util/ranges');
const filter = require('joystream/core/filter');

module.exports = function(config, storage, substrate)
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
        res.contentType(type || 'application/octet-stream');
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
    put: async function(req, res, _next)
    {
      const id = req.params.id;
      const name = req.params.name;

      // Find repository
      const repo = storage.get(id);
      if (!repo) {
        res.status(404).send({ message: `Repository with id "${id}" not found.` });
        return;
      }

      // First check if we're the liaison for the name, otherwise we can bail
      // out already.
      const role_addr = substrate.key.address();
      try {
        await substrate.checkLiaisonForDataObject(role_addr, name);
      } catch (err) {
        res.status(403).send({ message: err.toString() });
        return;
      }

      // Check for file type.
      const ft_stream = await file_type.stream(req);
      const fileType = ft_stream.fileType || { mime: 'application/octet-stream' };
      debug('Detected Content-Type is', fileType.mime);

      // Filter
      const filter_result = filter(config, req.headers, fileType.mime);
      if (200 != filter_result.code) {
        res.status(filter_result.code).send({ message: filter_result.message });

        // Reject the content
        await substrate.rejectContent(role_addr, name);
        return;
      }
      await substrate.acceptContent(role_addr, name);

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
        ft_stream.on('end', async () => {
          // Create storage relationship and flip it to ready.
          const dosr_id = await substrate.createAndReturnStorageRelationship(role_addr, name);
          await substrate.toggleStorageRelationshipReady(role_addr, dosr_id, true);

          res.status(200).send({ message: 'Asset uploaded.' });
        });
        ft_stream.pipe(stream);
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
      repo.size(name, (err, size) => {
        if (err) {
          res.status(err.code).send({ message: err.message });
          return;
        }

        repo.open(name, 'r', (err, type, stream) => {
          if (err) {
            res.status(err.code).send({ message: err.message });
            return;
          }

          // Add a file extension to download requests if necessary. If the file
          // already contains an extension, don't add one.
          var send_name = name;
          if (download) {
            var ext = path.extname(send_name);
            if (!ext) {
              ext = mime_types.extension(type);
              if (ext) {
                send_name = `${send_name}.${ext}`;
              }
            }
          }

          var opts = {
            name: send_name,
            type: type,
            size: size,
            ranges: ranges,
            download: download,
          };
          util_ranges.send(res, stream, opts);
        });
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
        '*/*': {
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


