import express from 'express'
import path from 'path'
import { Express } from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'

// TODO: add swagger UI
// TODO: custom errors (including validation errors)

export async function createServer(
  devMode: boolean,
  uploadsDir: string
): Promise<Express> {
  const server = express()
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml')

  if (devMode) {
    // Form for the upload testing.
    server.get('/', function (req, res) {
      res.send(
        `<html>
          <head/>
          <body>
            <form method="POST" enctype="multipart/form-data" action="/api/v1/upload">
              <h2>Api development form (upload)</h2>
              <table>
                <tr><td>DataObjectId</td><td><input name="dataObjectId" value="0"</td></tr>
                <tr><td>WorkerId</td><td><input name="workerId" value="0"></td></tr>
                <tr><td>StorageBucketId</td><td><input name="storageBucketId" value="0"></td></tr>
                <tr><td><input type="file" name="recfile"><br /></td><td><input type="submit"></td></tr>
            </form>
          </body>
        </html>`
      )
      res.end()
    })
    // TODO: localhost only?
    server.use('/spec', express.static(spec))
  }

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
