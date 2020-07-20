const { discover } = require('@joystream/service-discovery')
const debug = require('debug')('joystream:colossus:api:discovery')

const MAX_CACHE_AGE = 30 * 60 * 1000
const USE_CACHE = true

module.exports = function (runtime) {
  const doc = {
    // parameters for all operations in this path
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Actor accouuntId',
        schema: {
          type: 'string', // integer ?
        },
      },
    ],

    // Resolve Service Information
    async get(req, res) {
      let parsedId
      try {
        parsedId = parseInt(req.params.id)
      } catch (err) {
        return res.status(400).end()
      }

      const id = parsedId
      let cacheMaxAge = req.query.max_age

      if (cacheMaxAge) {
        try {
          cacheMaxAge = parseInt(cacheMaxAge)
        } catch (err) {
          cacheMaxAge = MAX_CACHE_AGE
        }
      } else {
        cacheMaxAge = 0
      }

      // todo - validate id before querying

      try {
        debug(`resolving ${id}`)
        const info = await discover.discover(id, runtime, USE_CACHE, cacheMaxAge)
        if (info === null) {
          debug('info not found')
          res.status(404).end()
        } else {
          res.status(200).send(info)
        }
      } catch (err) {
        debug(`${err}`)
        res.status(404).end()
      }
    },
  }

  // OpenAPI specs
  doc.get.apiDoc = {
    description: 'Resolve Service Information',
    operationId: 'discover',
    // tags: ['asset', 'data'],
    responses: {
      200: {
        description: 'Wrapped JSON Service Information',
        content: {
          'application/json': {
            schema: {
              required: ['serialized'],
              properties: {
                serialized: {
                  type: 'string',
                },
                signature: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  }

  return doc
}
