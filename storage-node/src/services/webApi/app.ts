import express from 'express'
import path from 'path'
import cors from 'cors'
import { Express, NextFunction } from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'
import { HttpError, OpenAPIV3 } from 'express-openapi-validator/dist/framework/types'
import { AppConfig, sendResponseWithError, WebApiError } from './controllers/common'
import { verifyBagAssignment, verifyBucketId } from './controllers/filesApi'
import {
  createExpressErrorLoggerOptions,
  createExpressDefaultLoggerOptions,
  httpLogger,
  errorLogger,
} from '../../services/logger'
import { parseBagId } from '../helpers/bagTypes'
import BN from 'bn.js'
import asyncHandler from 'express-async-handler'
import { RouteMetadata } from 'express-openapi-validator/dist/framework/openapi.spec.loader'
import { createFileUploader } from 'src/commands/util/fileStorageSetup'

/**
 * Creates Express web application. Uses the OAS spec file for the API.
 *
 * @param config - web app configuration parameters
 * @returns Express promise.
 */
export async function createApp(config: AppConfig): Promise<Express> {
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml')
  const app = express()
  const expressLoggerOptions = createExpressDefaultLoggerOptions()

  app.use(cors())
  app.use(express.json())
  app.use(httpLogger(expressLoggerOptions))

  app.use(
    // Set parameters for each request.
    (req: express.Request, res: express.Response, next: NextFunction) => {
      res.locals = config

      next()
    },

    // Avoid node connecting to itself
    (req: express.Request, res: express.Response, next: NextFunction) => {
      if (res.locals.x_host_id === req.headers['X-COLOSSUS-HOST-ID']) {
        sendResponseWithError(res, next, new Error('LoopbackRequestDetected'), 'general-request')
      } else {
        next()
      }
    },
    // Catch aborted requests event early, before we get a chance to handle
    // it in multer middleware. This is an edge case which happens when only
    // a small amount of data is transferred, before multer starts parsing.
    (req: express.Request, res: express.Response<unknown, AppConfig>, next: NextFunction) => {
      if (req.path === '/api/v1/files') {
        req.on('aborted', () => (req.aborted = true))
      }
      next()
    },

    // Pre validate file upload params
    (req: express.Request, res: express.Response<unknown, AppConfig>, next: NextFunction) => {
      if (req.path === '/api/v1/files' && req.method === 'POST') {
        validateUploadFileParams(req, res)
          .then(next)
          .catch((error) => sendResponseWithError(res, next, error, 'upload'))
      } else {
        next()
      }
    },

    // Setup OpenAPiValidator
    OpenApiValidator.middleware({
      apiSpec: spec,
      validateApiSpec: true,
      validateResponses: process.env.NODE_ENV !== 'production',
      validateRequests: true,
      operationHandlers: {
        basePath: path.join(__dirname, './controllers'),
        resolver: (basePath: string, route: RouteMetadata, apiDoc: OpenAPIV3.Document) =>
          asyncHandler(OpenApiValidator.resolvers.modulePathResolver(basePath, route, apiDoc)),
      },
      fileUploader: createFileUploader(config, null),
    })
  ) // Required signature.

  // Error logger
  const errorLoggerOptions = createExpressErrorLoggerOptions()
  app.use(errorLogger(errorLoggerOptions))

  /* eslint-disable @typescript-eslint/no-unused-vars */
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Express error handling recommendation:
    // https://expressjs.com/en/guide/error-handling.html
    if (res.headersSent) {
      return next(err)
    }

    // Request error handler.
    if (err instanceof HttpError) {
      res.status(err.status || 500).json({
        type: 'request_exception',
        message: err.message,
      })
    } else {
      res.status(500).json({
        type: 'unknown_error',
        message: err.message,
      })
    }
  })

  return app
}

async function validateUploadFileParams(req: express.Request, res: express.Response<unknown, AppConfig>) {
  const { api, qnApi, workerId } = res.locals
  const storageBucketIdStr = req.query.storageBucketId?.toString() || ''
  const storageBucketId = new BN(storageBucketIdStr)
  const dataObjectId = new BN(req.query.dataObjectId?.toString() || '')
  const bagId = req.query.bagId?.toString() || ''

  if (!res.locals.uploadBuckets.includes(storageBucketIdStr)) {
    throw new WebApiError(`Server is not accepting uploads into this bucket`, 503)
  }

  const parsedBagId = parseBagId(bagId)

  const [dataObject] = await Promise.all([
    api.query.storage.dataObjectsById(parsedBagId, dataObjectId),
    verifyBagAssignment(api, parsedBagId, storageBucketId),
    verifyBucketId(qnApi, workerId, storageBucketId),
  ])

  if (dataObject.isEmpty) {
    throw new WebApiError(`Data object ${dataObjectId} doesn't exist in storage bag ${parsedBagId}`, 400)
  }

  const isObjectPending = await res.locals.acceptPendingObjectsService.pendingObjectExists(dataObjectId.toString())
  if (isObjectPending) {
    throw new WebApiError(`Data object ${dataObjectId} already exists (pending)`, 400)
  }

  const { dataObjectCache } = res.locals
  const isInStorage = await dataObjectCache.getDataObjectIdFromCache(dataObjectId.toString())
  if (isInStorage) {
    throw new WebApiError(`Data object ${dataObjectId} already exists (in storage)`, 400)
  }
}
