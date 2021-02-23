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

        // We don't know whether the filtering occurs before or after the
        // stream was finished, and can only commit if both passed.
        let finished = false
        let accepted = false
        const possiblyCommit = () => {
          if (finished && accepted) {
            debug('Stream is finished and passed filters; committing.')
            stream.commit()
          }
        }

        // May be emitted before entire stream is processed. If there was an error detecting the
        // file info at end of stream info will be null.
        stream.on('fileInfo', async (info) => {
          try {
            debug('Detected file info:', info)

            if (!info) {
              // Do not process unknown content.
              debug('Failed to detect content type!')
              stream.end()
              res.status(403).send({ message: 'Uknown content type' })
              return
            }

            // Filter allowed content types
            // == We haven't computed ipfs hash yet so is it really fair to reject content?
            // == It may not be the real uploader doing the upload!
            const filterResult = filter({}, req.headers, info.mimeType)
            if (filterResult.code !== 200) {
              debug('Rejecting content', filterResult.message)
              stream.end()
              res.status(filterResult.code).send({ message: filterResult.message })

              // Reject the content
              await runtime.assets.rejectContent(roleAddress, providerId, id)
            } else {
              debug('Content accepted.')
              accepted = true

              // We may have to commit the stream.
              possiblyCommit()
            }
          } catch (err) {
            errorHandler(res, err)
          }
        })

        // `finish` comes before `fileInfo` event if file info detection happened at end of stream.
        stream.on('finish', () => {
          try {
            finished = true
            possiblyCommit()
          } catch (err) {
            errorHandler(res, err)
          }
        })

        stream.on('committed', async (hash) => {
          try {
            if (hash !== dataObject.ipfs_content_id.toString()) {
              debug('Rejecting content. IPFS hash does not match value in objectId')
              await runtime.assets.rejectContent(roleAddress, providerId, id)
              res.status(400).send({ message: "Uploaded content doesn't match IPFS hash" })
              return
            }

            debug('accepting Content')
            await runtime.assets.acceptContent(roleAddress, providerId, id)

            debug('creating storage relationship for newly uploaded content')
            // Create storage relationship and flip it to ready.
            const dosrId = await runtime.assets.createStorageRelationship(roleAddress, providerId, id)

            debug('toggling storage relationship for newly uploaded content')
            await runtime.assets.toggleStorageRelationshipReady(roleAddress, providerId, dosrId, true)

            debug('Sending OK response.')
            res.status(200).send({ message: 'Asset uploaded.' })
          } catch (err) {
            debug(`${err.message}`)
            errorHandler(res, err)
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
