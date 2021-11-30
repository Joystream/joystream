import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { PostgresServiceDeployment } from 'pulumi-common'

const config = new pulumi.Config()
const DB_PASS = config.require('dbPassword')
const BLOCK_HEIGHT = config.require('blockHeight') || '0'
const WS_PROVIDER_ENDPOINT_URI = config.require('joystreamWsEndpoint')

const DB_USERNAME = 'postgres'
const INDEXER_DATABASE_NAME = 'indexer'
const DB_PORT = '5432'

/**
 * ServiceDeployment is an example abstraction that uses a class to fold together the common pattern of a
 * Kubernetes Deployment and its associated Service object.
 * This class deploys a db, a migration job and indexer deployment and service
 */
export class IndexerServiceDeployment extends pulumi.ComponentResource {
  public readonly deployment: k8s.apps.v1.Deployment
  public readonly service: k8s.core.v1.Service

  constructor(name: string, args: ServiceDeploymentArgs, opts?: pulumi.ComponentResourceOptions) {
    super('indexer:service:IndexerServiceDeployment', name, {}, opts)

    // Name passed in the constructor will be the endpoint for accessing the service
    const serviceName = name
    const appLabels = { appClass: 'indexer' }

    const indexerDbName = 'indexer-db'
    const indexerDb = new PostgresServiceDeployment(
      indexerDbName,
      {
        namespaceName: args.namespaceName,
        env: [
          { name: 'POSTGRES_USER', value: DB_USERNAME },
          { name: 'POSTGRES_PASSWORD', value: DB_PASS },
          { name: 'POSTGRES_DB', value: INDEXER_DATABASE_NAME },
          { name: 'PGPORT', value: DB_PORT },
        ],
        storage: args.storage,
      },
      { parent: this }
    )

    this.deployment = new k8s.apps.v1.Deployment(
      'indexer',
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
                  name: 'redis',
                  image: 'redis:6.0-alpine',
                  ports: [{ containerPort: 6379 }],
                },
                {
                  name: 'indexer',
                  image: 'joystream/hydra-indexer:3.0.0',
                  env: [
                    { name: 'DB_HOST', value: indexerDbName },
                    { name: 'DB_NAME', value: INDEXER_DATABASE_NAME },
                    { name: 'DB_PASS', value: DB_PASS },
                    { name: 'DB_USER', value: DB_USERNAME },
                    { name: 'DB_PORT', value: DB_PORT },
                    { name: 'INDEXER_WORKERS', value: '5' },
                    // localhost for redis should work since it is in the same deployment
                    { name: 'REDIS_URI', value: 'redis://localhost:6379/0' },
                    { name: 'DEBUG', value: 'index-builder:*' },
                    { name: 'WS_PROVIDER_ENDPOINT_URI', value: WS_PROVIDER_ENDPOINT_URI },
                    { name: 'TYPES_JSON', value: 'types.json' },
                    { name: 'PGUSER', value: DB_USERNAME },
                    { name: 'BLOCK_HEIGHT', value: BLOCK_HEIGHT },
                  ],
                  volumeMounts: [
                    {
                      mountPath: '/home/hydra/packages/hydra-indexer/types.json',
                      name: 'indexer-volume',
                      subPath: 'fileData',
                    },
                  ],
                  command: ['/bin/sh', '-c'],
                  args: ['yarn db:bootstrap && yarn start:prod'],
                },
                {
                  name: 'hydra-indexer-gateway',
                  image: 'joystream/hydra-indexer-gateway:3.0.0',
                  env: [
                    { name: 'WARTHOG_STARTER_DB_DATABASE', value: INDEXER_DATABASE_NAME },
                    { name: 'WARTHOG_STARTER_DB_HOST', value: indexerDbName },
                    { name: 'WARTHOG_STARTER_DB_PASSWORD', value: DB_PASS },
                    { name: 'WARTHOG_STARTER_DB_PORT', value: DB_PORT },
                    { name: 'WARTHOG_STARTER_DB_USERNAME', value: DB_USERNAME },
                    // localhost for redis should work since it is in the same deployment
                    { name: 'WARTHOG_STARTER_REDIS_URI', value: 'redis://localhost:6379/0' },
                    { name: 'WARTHOG_APP_PORT', value: '4001' },
                    { name: 'PORT', value: '4001' },
                    { name: 'DEBUG', value: '*' },
                  ],
                  ports: [{ name: 'hydra-port', containerPort: 4001 }],
                },
              ],
              volumes: [
                {
                  name: 'indexer-volume',
                  configMap: {
                    name: args.defsConfig,
                  },
                },
              ],
            },
          },
        },
      },
      { parent: this, dependsOn: indexerDb.service }
    )

    // Create a Service for the Indexer
    this.service = new k8s.core.v1.Service(
      serviceName,
      {
        metadata: {
          labels: appLabels,
          namespace: args.namespaceName,
          name: serviceName,
        },
        spec: {
          ports: [{ name: 'port-1', port: 4000, targetPort: 'hydra-port' }],
          selector: appLabels,
        },
      },
      { parent: this }
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
  env?: Environment[]
  storage: number
}
