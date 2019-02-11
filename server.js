'use strict';

const express = require('express');
const openapi = require('express-openapi');
const bodyParser = require('body-parser');
const cors = require('cors');

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Configure app
const app = express();
app.use(cors());
app.use(bodyParser.json());
// FIXME app.use(bodyParser.urlencoded({ extended: true }));

openapi.initialize({
  apiDoc: yaml.safeLoad(fs.readFileSync('./api-base.yml')),
  app: app,
  paths: path.resolve(__dirname, 'paths')
});

app.use(function(err, req, res, next) {
  res.status(err.status).json(err);
});

module.exports = app;

// Start app
const port = process.env.PORT || 3000;
app.listen(port);
console.log('API server started on http://localhost:' + port);
