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

// Allow require relative to project root
require.main.paths.push(path.join(__dirname, 'lib'))

// Project requires
const validateResponses = require('middleware/validate_responses');
const fileUploads = require('middleware/file_uploads');
const pagination = require('middleware/pagination');

// Configure app
const app = express();
app.use(cors());
app.use(bodyParser.json());
// FIXME app.use(bodyParser.urlencoded({ extended: true }));

// Load & extend/configure API docs
var api = yaml.safeLoad(fs.readFileSync('./api-base.yml'));
api['x-express-openapi-additional-middleware'] = [validateResponses];
api['x-express-openapi-validation-strict'] = true;

api = pagination.openapi(api);

openapi.initialize({
  apiDoc: api,
  app: app,
  paths: path.resolve(__dirname, 'paths'),
  docsPath: '/swagger.json',
  consumesMiddleware: {
    'multipart/form-data': fileUploads
  },
});

// If no other handler gets triggered (errors), respond with the
// error serialized to JSON.
app.use(function(err, req, res, next) {
  res.status(err.status).json(err);
});

module.exports = app;

// Start app
const port = process.env.PORT || 3000;
app.listen(port);
console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
