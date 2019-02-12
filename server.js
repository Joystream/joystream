'use strict';

const express = require('express');
const openapi = require('express-openapi');
const bodyParser = require('body-parser');
const cors = require('cors');

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const validateResponses = require('./lib/middleware/validate_responses');
const fileUploads = require('./lib/middleware/file_uploads');

// Configure app
const app = express();
app.use(cors());
app.use(bodyParser.json());
// FIXME app.use(bodyParser.urlencoded({ extended: true }));
//
var api = yaml.safeLoad(fs.readFileSync('./api-base.yml'));
api['x-express-openapi-additional-middleware'] = [validateResponses];
api['x-express-openapi-validation-strict'] = true;

openapi.initialize({
  apiDoc: api,
  app: app,
  paths: path.resolve(__dirname, 'paths'),
  docsPath: '/swagger.json',
  consumesMiddleware: {
    'multipart/form-data': fileUploads
  },
});

module.exports = app;

// Start app
const port = process.env.PORT || 3000;
app.listen(port);
console.log('API server started; API docs at http://localhost:' + port + '/swagger.json');
