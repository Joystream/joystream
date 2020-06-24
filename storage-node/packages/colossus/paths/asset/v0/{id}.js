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

const debug = require('debug')('joystream:colossus:api:asset');

const util_ranges = require('@joystream/util/ranges');
const filter = require('@joystream/storage/filter');

function error_handler(response, err, code)
{
  debug(err);
  response.status((err.code || code) || 500).send({ message: err.toString() });
}


module.exports = function(flags, storage, runtime)
{
  var doc = {
    // parameters for all operations in this path
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Joystream Content ID',
        schema: {
          type: 'string',
        },
      },
    ],

    // Head: report that ranges are OK
    head: async function(req, res, _next)
    {
      const id = req.params.id;

      // Open file
      try {
        const size = await storage.size(id);
        const stream = await storage.open(id, 'r');
        const type = stream.file_info.mime_type;

        // Close the stream; we don't need to fetch the file (if we haven't
        // already). Then return result.
        stream.destroy();

        res.status(200);
        res.contentType(type);
        res.header('Content-Disposition', 'inline');
        res.header('Content-Transfer-Encoding', 'binary');
        res.header('Accept-Ranges', 'bytes');
        if (size > 0) {
          res.header('Content-Length', size);
        }
        res.send();
      } catch (err) {
        error_handler(res, err, err.code);
      }
    },

    // Put for uploads
    put: async function(req, res, _next)
    {
      const id = req.params.id; // content id

      // First check if we're the liaison for the name, otherwise we can bail
      // out already.
      const role_addr = runtime.identities.key.address;
      const providerId = runtime.storageProviderId;
      let dataObject;
      try {
        debug('calling checkLiaisonForDataObject')
        dataObject = await runtime.assets.checkLiaisonForDataObject(providerId, id);
        debug('called checkLiaisonForDataObject')
      } catch (err) {
        error_handler(res, err, 403);
        return;
      }

      // We'll open a write stream to the backend, but reserve the right to
      // abort upload if the filters don't smell right.
      var stream;
      try {
        stream = await storage.open(id, 'w');

        // We don't know whether the filtering occurs before or after the
        // stream was finished, and can only commit if both passed.
        var finished = false;
        var accepted = false;
        const possibly_commit = () => {
          if (finished && accepted) {
            debug('Stream is finished and passed filters; committing.');
            stream.commit();
          }
        };


        stream.on('file_info', async (info) => {
          try {
            debug('Detected file info:', info);

            // Filter
            const filter_result = filter(flags, req.headers, info.mime_type);
            if (200 != filter_result.code) {
              debug('Rejecting content', filter_result.message);
              stream.end();
              res.status(filter_result.code).send({ message: filter_result.message });

              // Reject the content
              await runtime.assets.rejectContent(role_addr, providerId, id);
              return;
            }
            debug('Content accepted.');
            accepted = true;

            // We may have to commit the stream.
            possibly_commit();
          } catch (err) {
            error_handler(res, err);
          }
        });

        stream.on('finish', () => {
          try {
            finished = true;
            possibly_commit();
          } catch (err) {
            error_handler(res, err);
          }
        });

        stream.on('committed', async (hash) => {
          console.log('commited', dataObject)
          try {
            if (hash !== dataObject.ipfs_content_id.toString()) {
              debug('Rejecting content. IPFS hash does not match value in objectId');
              await runtime.assets.rejectContent(role_addr, providerId, id);
              res.status(400).send({ message: "Uploaded content doesn't match IPFS hash" });
              return;
            }

            debug('accepting Content')
            await runtime.assets.acceptContent(role_addr, providerId, id);

            debug('creating storage relationship for newly uploaded content')
            // Create storage relationship and flip it to ready.
            const dosr_id = await runtime.assets.createAndReturnStorageRelationship(role_addr, providerId, id);

            debug('toggling storage relationship for newly uploaded content')
            await runtime.assets.toggleStorageRelationshipReady(role_addr, providerId, dosr_id, true);

            debug('Sending OK response.');
            res.status(200).send({ message: 'Asset uploaded.' });
          } catch (err) {
            debug(`${err.message}`);
            error_handler(res, err);
          }
        });

        stream.on('error', (err) => error_handler(res, err));
        req.pipe(stream);

      } catch (err) {
        error_handler(res, err);
        return;
      }
    },

    // Get content
    get: async function(req, res, _next)
    {
      const id = req.params.id;
      const download = req.query.download;

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
      try {
        const size = await storage.size(id);
        const stream = await storage.open(id, 'r');

        // Add a file extension to download requests if necessary. If the file
        // already contains an extension, don't add one.
        var send_name = id;
        const type = stream.file_info.mime_type;
        if (download) {
          var ext = path.extname(send_name);
          if (!ext) {
            ext = stream.file_info.ext;
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


      } catch (err) {
        error_handler(res, err, err.code);
      }
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
