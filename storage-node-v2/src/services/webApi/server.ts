import express from 'express'
import path from 'path'
import cors from 'cors'
import { Express } from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'

// TODO: custom errors (including validation errors)

export async function createServer(
  devMode: boolean,
  uploadsDir: string
): Promise<Express> {
  const server = express()
  server.use(cors())
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml')

  if (devMode) {
    server.use('/spec', express.static(spec))
  }

  // TODO: check path
  server.use('/files', express.static(uploadsDir))

  server.use(
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
    })
  )

  return server
}
