const { discover } = require('@joystream/discovery')
const debug = require('debug')('joystream:api:discovery');
module.exports = function(config, storage, substrate)
{
  var doc = {
    // parameters for all operations in this path
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Actor accouuntId',
        schema: {
          type: 'string',
        },
      },
    ],

    // Resolve Service Information
    get: function(req, res, _next)
    {
        const id = req.params.id;

        substrate.roles.checkForRole(id)
          .then((isActor) => {
            if (!isActor) {
              res.status(404).end()
            } else {
              discover.discover(id, substrate).then((info) => {
                debug(info)
                res.status(200).send(info)
              })
            }
          })
          .catch((err) => {
            res.status(500).end()
          })
    }
  };

    // OpenAPI specs
    doc.get.apiDoc = {
        description: 'Resolve Service Information',
        operationId: 'discover',
        //tags: ['asset', 'data'],
        responses: {
            200: {
                description: 'Wrapped JSON Service Information',
                content: {
                  'application/json': {
                    schema: {
                      required: ['serialized'],
                      properties: {
                        'serialized': {
                          type: 'string'
                        },
                        'signature': {
                          type: 'string'
                        }
                      },
                    },
                  }
                }
            }
        }
    }

    return doc;
};

