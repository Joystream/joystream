'use strict';

module.exports = function(config, storage)
{
  var doc = {
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
      storage.size(id, function(size, err) {
        if (err) {
          res.status(err.code).send({ message: err.message });
          return;
        }
        res.status(200).send({ size: size });
      });
    }
  };

  doc.get.apiDoc =
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

  return doc;
};


