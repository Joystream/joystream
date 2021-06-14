import express from 'express'
import path from 'path'
import cors from 'cors'
import { Express, NextFunction } from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'
import { OpenAPIV3 } from 'express-openapi-validator/dist/framework/types'
import { KeyringPair } from '@polkadot/keyring/types'
import { ApiPromise } from '@polkadot/api'
import { TokenRequest, verifyTokenSignature } from '../helpers/auth'
import { createStorageBucket } from '../runtime/extrinsics'
import { parseBagId } from '../../services/helpers/bagIdParser'

// TODO: custom errors (including validation errors)
// TODO: custom authorization errors

export async function createApp(
  api: ApiPromise,
  account: KeyringPair,
  workerId: number,
  uploadsDir: string
): Promise<Express> {
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml')

  const app = express()

  app.use(cors())
  app.use(express.json())

  // TODO: check path
  app.use('/files', express.static(uploadsDir))

  app.get('/test', async function (req, res) {
    await createStorageBucket(api, account)

    res.send('ok')
  })

  app.use(
    // Set parameters for each request.
    (req: express.Request, res: express.Response, next: NextFunction) => {
      res.locals.storageProviderAccount = account
      res.locals.workerId = workerId
      res.locals.api = api
      next()
    },
    OpenApiValidator.middleware({
      apiSpec: spec,
      validateApiSpec: true,
      validateResponses: true,
      validateRequests: true,
      operationHandlers: {
        basePath: path.join(__dirname, './controllers'),
        resolver: OpenApiValidator.resolvers.modulePathResolver,
      },
      fileUploader: { dest: uploadsDir },
      validateSecurity: {
        handlers: {
          UploadAuth: validateUpload(api, account),
        },
      },
    })
  )

  return app
}

type ValidateUploadFunction = (
  req: express.Request,
  scopes: string[],
  schema: OpenAPIV3.SecuritySchemeObject
) => boolean | Promise<boolean>

function validateUpload(
  api: ApiPromise,
  account: KeyringPair
): ValidateUploadFunction {
  // We don't use these variables yet.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  return (
    req: express.Request,
    scopes: string[],
    schema: OpenAPIV3.SecuritySchemeObject
  ) => {
    const tokenSignature = req.headers['x-api-key'] as string

    // Validate bagId.
    parseBagId(api, req.body.bagId)

    // TODO: token construction
    const sourceTokenRequest: TokenRequest = {
      dataObjectId: parseInt(req.body.dataObjectId),
    }

    return verifyTokenSignature(sourceTokenRequest, tokenSignature, account)
  }
}
