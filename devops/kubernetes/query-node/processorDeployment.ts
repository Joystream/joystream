import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { PostgresServiceDeployment } from 'pulumi-common'

/**
 * ServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 * This class deploys a db, a migration job, graphql server and processor
 */
export class ProcessorServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service
  public readonly endpoint: string

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('processor:service:ProcessorServiceDeployment', name, {}, opts)

    const config = new pulumi.Config()
    const DB_PASS = config.require('dbPassword')
    const DB_USERNAME = 'postgres'
    const PROCESSOR_DATABASE_NAME = 'processor'
    const DB_PORT = '5432'

    // Name passed in the constructor will be the endpoint for accessing the service
    this.endpoint = 'graphql-server'

    const processorDbName = 'processor-db'
    const processorDb = new PostgresServiceDeployment(
      processorDbName,
      {
        namespaceName: args.namespaceName,
        env: [
          { name: 'POSTGRES_USER', value: DB_USERNAME },
          { name: 'POSTGRES_PASSWORD', value: DB_PASS },
          { name: 'POSTGRES_DB', value: PROCESSOR_DATABASE_NAME },
          { name: 'PGPORT', value: DB_PORT },
        ],
        storage: args.storage,
      },
      { parent: this }
    )

    const processorMigrationJob = new k8s.batch.v1.Job(
      'processor-db-migration',
      {
        metadata: {
          namespace: args.namespaceName,
        },
        spec: {
          backoffLimit: 0,
          template: {
            spec: {
              containers: [
                {
                  name: 'db-migration',
                  image: args.joystreamAppsImage,
                  imagePullPolicy: 'IfNotPresent',
                  resources: { requests: { cpu: '100m', memory: '100Mi' } },
                  env: [
                    {
                      name: 'WARTHOG_DB_HOST',
                      value: processorDbName,
                    },
                    {
                      name: 'DB_HOST',
                      value: processorDbName,
                    },
                    { name: 'WARTHOG_DB_DATABASE', value: PROCESSOR_DATABASE_NAME },
                    { name: 'WARTHOG_DB_USERNAME', value: DB_USERNAME },
                    { name: 'WARTHOG_DB_PASSWORD', value: DB_PASS },
                    { name: 'WARTHOG_DB_PORT', value: DB_PORT },
                    { name: 'DB_NAME', value: PROCESSOR_DATABASE_NAME },
                    { name: 'DB_PASS', value: DB_PASS },
                    { name: 'DB_USER', value: DB_USERNAME },
                    { name: 'DB_PORT', value: DB_PORT },
                  ],
                  command: ['/bin/sh', '-c'],
                  args: [
                    // 'yarn workspace query-node config:dev;',
                    'yarn workspace query-node-root db:prepare; yarn workspace query-node-root db:migrate',
                  ],
                },
              ],
              restartPolicy: 'Never',
            },
          },
        },
      },
      { parent: this, dependsOn: processorDb.service }
    )

    let appLabels = { appClass: 'graphql-server' }

    this.deployment = new k8s.apps.v1.Deployment(
      'graphql-server',
      {
        metadata: {
          namespace: args.namespaceName,
          labels: appLabels,
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: appLabels },
          template: {
            metadata: {
              labels: appLabels,
            },
            spec: {
              containers: [
                {
                  name: 'graphql-server',
                  image: args.joystreamAppsImage,
                  imagePullPolicy: 'IfNotPresent',
                  env: [
                    { name: 'DB_HOST', value: processorDbName },
                    { name: 'DB_PASS', value: DB_PASS },
                    { name: 'DB_USER', value: DB_USERNAME },
                    { name: 'DB_PORT', value: DB_PORT },
                    { name: 'DB_NAME', value: PROCESSOR_DATABASE_NAME },
                    { name: 'WARTHOG_DB_DATABASE', value: PROCESSOR_DATABASE_NAME },
                    { name: 'WARTHOG_DB_USERNAME', value: DB_USERNAME },
                    { name: 'WARTHOG_DB_PASSWORD', value: DB_PASS },
                    { name: 'WARTHOG_APP_PORT', value: '4002' },
                    // Why do we need this anyway?
                    { name: 'GRAPHQL_SERVER_HOST', value: 'graphql-server' },
                  ],
                  ports: [{ name: 'graph-ql-port', containerPort: 4002 }],
                  args: ['workspace', 'query-node-root', 'query-node:start:prod'],
                },
              ],
            },
          },
        },
      },
      { parent: this, dependsOn: processorMigrationJob }
    )

    // Create a Service for the GraphQL Server
    this.service = new k8s.core.v1.Service(
      'graphql-server',
      {
        metadata: {
          labels: appLabels,
          namespace: args.namespaceName,
          name: this.endpoint,
        },
        spec: {
          ports: [{ name: 'port-1', port: 8081, targetPort: 'graph-ql-port' }],
          selector: appLabels,
        },
      },
      { parent: this }
    )

    const indexerURL = args.externalIndexerUrl || `http://indexer:4000/graphql`
    appLabels = { appClass: 'processor' }

    const processorDeployment = new k8s.apps.v1.Deployment(
      `processor`,
      {
        metadata: {
          namespace: args.namespaceName,
          labels: appLabels,
        },
        spec: {
          replicas: 1,
          selector: { matchLabels: appLabels },
          template: {
            metadata: {
              labels: appLabels,
            },
            spec: {
              containers: [
                {
                  name: 'processor',
                  image: args.joystreamAppsImage,
                  imagePullPolicy: 'IfNotPresent',
                  env: [
                    {
                      name: 'INDEXER_ENDPOINT_URL',
                      value: indexerURL,
                    },
                    { name: 'TYPEORM_HOST', value: processorDbName },
                    { name: 'TYPEORM_DATABASE', value: PROCESSOR_DATABASE_NAME },
                    { name: 'DEBUG', value: 'index-builder:*' },
                    { name: 'PROCESSOR_POLL_INTERVAL', value: '1000' },
                    { name: 'DB_PASS', value: DB_PASS },
                    { name: 'DB_USER', value: DB_USERNAME },
                    { name: 'DB_PORT', value: DB_PORT },
                    { name: 'WARTHOG_DB_DATABASE', value: PROCESSOR_DATABASE_NAME },
                    { name: 'WARTHOG_DB_USERNAME', value: DB_USERNAME },
                    { name: 'WARTHOG_DB_PASSWORD', value: DB_PASS },
                    { name: 'WARTHOG_DB_PORT', value: DB_PORT },
                    // These are note required but must be defined or processor will not startup
                    { name: 'WARTHOG_APP_HOST', value: 'graphql-server' },
                    { name: 'WARTHOG_APP_PORT', value: '4002' },
                  ],
                  volumeMounts: [
                    {
                      mountPath: '/joystream/query-node/mappings/lib/generated/types/typedefs.json',
                      name: 'processor-volume',
                      subPath: 'fileData',
                    },
                  ],
                  args: ['workspace', 'query-node-root', 'processor:start'],
                },
              ],
              volumes: [
                {
                  name: 'processor-volume',
                  configMap: {
                    name: args.defsConfig,
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this, dependsOn: this.service }
    )
  }
}

interface Environment {
  name: string
  value: string
}

export interface ServiceDeploymentArgs {
  namespaceName: pulumi.Output<string>
  joystreamAppsImage: pulumi.Output<string>
  defsConfig: pulumi.Output<string> | undefined
  externalIndexerUrl: string | undefined
  env?: Environment[]
  storage: number
}
