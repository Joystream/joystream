/*
 * This file is part of the storage node for the Joystream project.
 * Copyright (C) 2019 Joystream Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

// Project requires
const validateResponses = require('./middleware/validate_responses');
const fileUploads = require('./middleware/file_uploads');
const pagination = require('@joystream/storage-utils/pagination');
const storage = require('@joystream/storage-node-backend');

// Configure app
function create_app(project_root, storage, runtime)
{
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
      storage: storage,
      runtime: runtime,
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
