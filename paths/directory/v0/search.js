'use strict';

const pagination = require('joystream/util/pagination');

module.exports = {
  get: function(req, res, _next)
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
  description: 'Freeform search for content.',
  operationId: 'contentList',
  tags: ['content', 'listing'],
  parameters: [
    {
      name: 'q',
      in: 'query',
      description: 'The search query.',
      schema: {
        type: 'string',
      },
    },
  ].concat(pagination.parameters),
  responses: {
    200: {
      description: 'Search results.',
      content: {
        'application/json': {
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
      },
    },
    default: {
      description: 'Unexpected error',
      content: {
        'application/json': {
          schema: {
            '$ref': '#/definitions/Error'
          },
        },
      },
    },
  },
};
