module.exports = {
  client: {
    service: {
      name: 'atlas-graphql',
      localSchemaFile: 'src/schema.graphql',
    },
    excludes: ['src/schema.graphql'],
  },
}
