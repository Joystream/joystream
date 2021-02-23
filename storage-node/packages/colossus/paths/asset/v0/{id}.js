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

const debug = require('debug')('joystream:colossus:api:asset')
const filter = require('@joystream/storage-node-backend/filter')
const ipfsProxy = require('../../../lib/middleware/ipfs_proxy')
const assert = require('assert')

function errorHandler(response, err, code) {
  debug(err)
  response.status(err.code || code || 500).send({ message: err.toString() })
}

const PROCESS_UPLOAD_BALANCE = 3

module.exports = function (storage, runtime, ipfsHttpGatewayUrl, anonymous) {
  // Creat the IPFS HTTP Gateway proxy middleware
  const proxy = ipfsProxy.createProxy(storage, ipfsHttpGatewayUrl)

  const doc = {
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

    // Put for uploads
    async put(req, res) {
      if (anonymous) {
        errorHandler(res, 'Uploads Not Permitted in Anonymous Mode', 400)
        return
      }

      const id = req.params.id // content id

      // Check if we're the liaison for the content
      const roleAddress = runtime.identities.key.address
      const providerId = runtime.storageProviderId
      let dataObject
      try {
        dataObject = await runtime.assets.checkLiaisonForDataObject(providerId, id)
      } catch (err) {
        errorHandler(res, err, 403)
        return
      }

      // Early filtering on content_length..do not wait for fileInfo
      // ensure its less than max allowed by node policy.
      const filterResult = filter({}, req.headers)

      if (filterResult.code !== 200) {
        errorHandler(res, new Error(filterResult.message), filterResult.code)
        return
      }

      // Ensure content_length from request equals size in data object.
      if (!dataObject.size_in_bytes.eq(filterResult.content_length)) {
        errorHandler(res, new Error('Content Length does not match expected size of content'), 403)
        return
      }

      const sufficientBalance = await runtime.providerHasMinimumBalance(PROCESS_UPLOAD_BALANCE)

      if (!sufficientBalance) {
        errorHandler(res, 'Insufficient balance to process upload!', 503)
        return
      }

      // We'll open a write stream to the backend, but reserve the right to
      // abort upload if the filters don't smell right.
      let stream
      try {
        stream = await storage.open(id, 'w')

        let aborted = false

        // Early file info detection so we can abort early on.. but we do not reject
        // content because we don't yet have ipfs computed
        stream.on('fileInfo', async (info) => {
          try {
            debug('Early file detection info:', info)

            const filterResult = filter({}, req.headers, info.mimeType)
            if (filterResult.code !== 200) {
              aborted = true
              debug('Ending stream', filterResult.message)
              stream.end()
              stream.cleanup()
              res.status(filterResult.code).send({ message: filterResult.message })
            }
          } catch (err) {
            errorHandler(res, err)
          }
        })

        // `finish` comes before `fileInfo` event if file info detection happened at end of stream.
        stream.on('finish', async () => {
          if (!aborted) {
            try {
              // try to get file info and compute ipfs hash before committing the stream to ifps node.
              await stream.info()
            } catch (err) {
              errorHandler(res, err)
            }
          }
        })

        // At end of stream we should have file info and computed ipfs hash - this event is emitted
        // only by explicitly calling stream.info() in the stream.on('finish') event handler
        stream.once('info', async (info, hash) => {
          if (hash === dataObject.ipfs_content_id.toString()) {
            const filterResult = filter({}, req.headers, info.mimeType)
            if (filterResult.code !== 200) {
              debug('Rejecting content')
              stream.cleanup()
              await runtime.assets.rejectContent(roleAddress, providerId, id)
              res.status(400).send({ message: 'Rejecting content type' })
            } else {
              try {
                await stream.commit()
              } catch (err) {
                errorHandler(res, err)
              }
            }
          } else {
            stream.cleanup()
            res.status(400).send({ message: 'Aborting - Not expected IPFS hash for content' })
          }
        })

        stream.on('committed', async (hash) => {
          // they cannot be different unless we did something stupid!
          assert(hash === dataObject.ipfs_content_id.toString())

          // Send ok response early, no need for client to wait for relationships to be created.
          debug('Sending OK response.')
          res.status(200).send({ message: 'Asset uploaded.' })

          try {
            debug('accepting Content')
            await runtime.assets.acceptContent(roleAddress, providerId, id)

            debug('creating storage relationship for newly uploaded content')
            // Create storage relationship and flip it to ready.
            const dosrId = await runtime.assets.createStorageRelationship(roleAddress, providerId, id)

            debug('toggling storage relationship for newly uploaded content')
            await runtime.assets.toggleStorageRelationshipReady(roleAddress, providerId, dosrId, true)
          } catch (err) {
            debug(`${err.message}`)
          }
        })

        stream.on('error', (err) => errorHandler(res, err))
        req.pipe(stream)
      } catch (err) {
        errorHandler(res, err)
      }
    },

    async get(req, res, next) {
      proxy(req, res, next)
    },

    async head(req, res, next) {
      proxy(req, res, next)
    },
  }

  // doc.get = proxy
  // doc.head = proxy
  // Note: Adding the middleware this way is causing problems!
  // We are loosing some information from the request, specifically req.query.download parameters for some reason.
  // Does it have to do with how/when the apiDoc is being processed? binding issue?

  // OpenAPI specs
  doc.get.apiDoc = {
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
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  }

  doc.put.apiDoc = {
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
                },
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
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  }

  doc.head.apiDoc = {
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
              $ref: '#/components/schemas/Error',
            },
          },
        },
      },
    },
  }

  return doc
}
