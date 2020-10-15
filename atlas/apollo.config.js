module.exports = {
  client: {
    service: {
      name: 'atlas-graphql',
      localSchemaFile: 'src/api/schemas/extendedQueryNode.graphql',
    },
    excludes: ['src/api/schemas/extendedQueryNode.graphql', 'src/api/schemas/orion.graphql'],
  },
}
