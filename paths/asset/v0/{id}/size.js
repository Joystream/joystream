'use strict';

const storage = require.main.require('joystream/storage');

module.exports = {
  // parameters for all operations in this path
  parameters: [
    {
      name: 'id',
      in: 'path',
      type: 'string',
      required: true,
      description: 'Asset ID'
    },
  ],

  // Getter for the size
  get: function(req, res, _next)
  {
    const id = req.params.id;
    // FIXME: get path from configuration, don't hardcode.
    var store = new storage.Storage('./storage');
    store.size(id, function(size, err) {
      if (err) {
        res.status(err.code).send({ message: err.message });
        return;
      }
      res.status(200).send({ size: size });
    });
  }
};

// OpenAPI specs
module.exports.get.apiDoc =
{
  description: 'Get the size of an asset.',
  operationId: 'assetSize',
  tags: ['asset', 'size', 'metadata'],
  responses: {
    200: {
      description: 'Asset size.',
      schema: {
        type: 'object',
        required: ['size'],
        properties: {
          size: {
            type: 'integer',
          },
        },
      },
    },
    default: {
      description: 'Unexpected error',
      schema: {
        '$ref': '#/definitions/Error'
      }
    }
  }
};
