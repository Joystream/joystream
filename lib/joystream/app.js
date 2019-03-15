'use strict';

// Node requires
const fs = require('fs');
const path = require('path');

// npm requires
const express = require('express');
const openapi = require('express-openapi');
const bodyParser = require('body-parser');
const cors = require('cors');
const yaml = require('js-yaml');

// Project root
const project_root = path.resolve(__dirname, '../..');

// Project requires
const validateResponses = require('joystream/middleware/validate_responses');
const fileUploads = require('joystream/middleware/file_uploads');
const pagination = require('joystream/util/pagination');
const storage = require('joystream/core/storage');

// Configure app
function create_app(storage, flags, config)
{
  const store_path = flags.storage || config.get('storage') || './storage';
  const store_type = flags['storageType'] || config.get('storageType') || 'hyperdrive';

  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  // FIXME app.use(bodyParser.urlencoded({ extended: true }));

  // Load & extend/configure API docs
  var api = yaml.safeLoad(fs.readFileSync(
    path.resolve(project_root, 'api-base.yml')));
  api['x-express-openapi-additional-middleware'] = [validateResponses];
  api['x-express-openapi-validation-strict'] = true;

  api = pagination.openapi(api);

  openapi.initialize({
    apiDoc: api,
    app: app,
    paths: path.resolve(project_root, 'paths'),
    docsPath: '/swagger.json',
    consumesMiddleware: {
      'multipart/form-data': fileUploads
    },
    dependencies: {
      config: config,
      storage: storage,
    },
  });

  // If no other handler gets triggered (errors), respond with the
  // error serialized to JSON.
  app.use(function(err, req, res, next) {
    res.status(err.status).json(err);
  });

  return app;
}

module.exports = create_app;
