import express from 'express'
import path from 'path'
import {Express} from 'express-serve-static-core'
import * as OpenApiValidator from 'express-openapi-validator'

//TODO: add swagger UI
//TODO: custom errors (including validation errors)


export async function createServer(devMode: boolean, uploadsDir: string): Promise<Express> {
  const server = express()
  const spec = path.join(__dirname, './../../api-spec/openapi.yaml');

  if (devMode) {
    // Form for the upload testing.
    server.get('/', function (_, res) {
      res.send('<html><head></head><body>\
                <form method="POST" enctype="multipart/form-data" action="/api/v1/upload">\
                  <h2>Api development form (upload)</h2>\
                  <input type="file" name="recfile"><br />\
                  <input type="submit">\
                </form>\
              </body></html>');
      res.end();
    });
    // TODO: localhost only?
    server.use('/spec', express.static(spec));
  }

  server.use(
    OpenApiValidator.middleware({
      apiSpec: spec,
      validateApiSpec: true,
      validateResponses: true,
      validateRequests: true,
      operationHandlers: {
          basePath: path.join(__dirname, './controllers'),
          resolver: OpenApiValidator.resolvers.modulePathResolver
      },
      fileUploader : { dest: uploadsDir },
    }),
  );

  return server
}
