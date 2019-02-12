'use strict';

const pagination = require.main.require('middleware/pagination');

module.exports = {
  get: function(req, res, next)
  {
    // TODO implement
    res.status(200).send(
      pagination.paginate(req, {
        results: [
          { name: 'Staked!' },
        ],
      })
    );
  }
};

// OpenAPI specs
module.exports.get.apiDoc =
{
  description: 'Get a content list.',
  operationId: 'contentList',
  tags: ['content', 'listing'],
  parameters: pagination.parameters,
  responses: {
    200: {
      description: 'Content directory entries.',
      schema: {
        type: 'object',
        required: ['results'],
        properties: {
          results: {
            '$ref': '#/definitions/ContentDirectoryEntries',
          },
          pagination: pagination.response,
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
