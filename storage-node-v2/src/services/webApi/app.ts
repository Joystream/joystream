import express from 'express'
import path from 'path'
import cors from 'cors'
import { Express, NextFunction } from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'
import {
  HttpError,
  OpenAPIV3,
  ValidateSecurityOpts,
} from 'express-openapi-validator/dist/framework/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { RequestData, verifyTokenSignature, parseUploadToken, UploadToken } from '../helpers/auth'
import { checkRemoveNonce } from '../../services/helpers/tokenNonceKeeper'
import { httpLogger, errorLogger } from '../../services/logger'
import { getLocalDataObjects } from '../../services/sync/synchronizer'

/**
 * Web application parameters.
 */
export type AppConfig = {
  /**
   * Runtime API promise
   */
  api: ApiPromise

  /**
   * KeyringPair instance
   */
  account: KeyringPair

  /**
   * Storage provider ID (worker ID)
   */
  workerId: number

  /**
   * Directory for the file uploading
   */
  uploadsDir: string
  /**
   * Directory within the `uploadsDir` for temporary file uploading
   */
  tempDirName: string

  /**
   *  Environment configuration
   */
  process: {
    version: string
    userAgent: string
  }

  /**
   * Query Node endpoint URL
   */
  queryNodeUrl: string

  /**
   * Enables uploading auth-schema validation
   */
  enableUploadingAuth: boolean

  /**
   * Runtime API promise
   */
  elasticSearchEndpoint?: string
}

/**
 * Creates Express web application. Uses the OAS spec file for the API.
 *
 * @param config - web app configuration parameters
 * @returns Express promise.
 */
export async function createApp(config: AppConfig): Promise<Express> {
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml')
  const tempFileUploadingDir = path.join(config.uploadsDir, config.tempDirName)

  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use(httpLogger(config.elasticSearchEndpoint))

  app.use(
    // Set parameters for each request.
    (req: express.Request, res: express.Response, next: NextFunction) => {
      res.locals.uploadsDir = config.uploadsDir
      res.locals.tempFileUploadingDir = tempFileUploadingDir
      res.locals.storageProviderAccount = config.account
      res.locals.workerId = config.workerId
      res.locals.api = config.api
      res.locals.config = config.process
      res.locals.queryNodeUrl = config.queryNodeUrl
      next()
    },
    // Setup OpenAPiValidator
    OpenApiValidator.middleware({
      apiSpec: spec,
      validateApiSpec: true,
      validateResponses: true,
      validateRequests: true,
      operationHandlers: {
        basePath: path.join(__dirname, './controllers'),
        resolver: OpenApiValidator.resolvers.modulePathResolver,
      },
      fileUploader: {
        dest: tempFileUploadingDir,
        // Busboy library settings
        limits: {
          // For multipart forms, the max number of file fields (Default: Infinity)
          files: 1,
          // For multipart forms, the max file size (in bytes) (Default: Infinity)
          fileSize: maxFileSize,
        },
      },
      validateSecurity: setupUploadingValidation(
        config.enableUploadingAuth,
        config.api,
        config.account
      ),
    })
  ) // Required signature.

  app.use(errorLogger())

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

    next()
  })

  return app
}

/**
 * Setup uploading validation. It disables the validation or returns the
 * 'validation security' configuration.
 *
 * @param enableUploadingAuth - enables uploading auth-schema validation
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 *
 * @returns false (disabled validation) or validation options.
 */
function setupUploadingValidation(
  enableUploadingAuth: boolean,
  api: ApiPromise,
  account: KeyringPair
): boolean | ValidateSecurityOpts {
  if (enableUploadingAuth) {
    const opts = {
      handlers: {
        UploadAuth: validateUpload(api, account),
      },
    }

    return opts
  }

  return false
}

// Defines a signature for a upload validation function.
type ValidateUploadFunction = (
  req: express.Request,
  scopes: string[],
  schema: OpenAPIV3.SecuritySchemeObject
) => boolean | Promise<boolean>

/**
 * Creates upload validation function with captured parameters from the request.
 *
 * @param api - runtime API promise
 * @param account - KeyringPair instance
 * @returns ValidateUploadFunction.
 */
function validateUpload(api: ApiPromise, account: KeyringPair): ValidateUploadFunction {
  // We don't use these variables yet.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return (
    req: express.Request,
    scopes: string[],
    schema: OpenAPIV3.SecuritySchemeObject
  ) => {
    const tokenString = req.headers['x-api-key'] as string
    const token = parseUploadToken(tokenString)

    const sourceTokenRequest: RequestData = {
      dataObjectId: parseInt(req.body.dataObjectId),
      storageBucketId: parseInt(req.body.storageBucketId),
      bagId: req.body.bagId,
    }

    verifyUploadTokenData(account.address, token, sourceTokenRequest)

    return true
  }
}

/**
 * Verifies upload request token. Throws exceptions on errors.
 *
 * @param accountAddress - account address (public key)
 * @param token - token object
 * @param request - data from the request to validate token
 */
function verifyUploadTokenData(accountAddress: string, token: UploadToken, request: RequestData): void {
  if (!verifyTokenSignature(token, accountAddress)) {
    throw new Error('Invalid signature')
  }

  if (token.data.dataObjectId !== request.dataObjectId) {
    throw new Error('Unexpected dataObjectId')
  }

  if (token.data.storageBucketId !== request.storageBucketId) {
    throw new Error('Unexpected storageBucketId')
  }

  if (token.data.bagId !== request.bagId) {
    throw new Error('Unexpected bagId')
  }

  if (token.data.validUntil < Date.now()) {
    throw new Error('Token expired')
  }

  if (!checkRemoveNonce(token.data.nonce)) {
    throw new Error('Nonce not found')
  }
}
