import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { PostgresServiceDeployment } from 'pulumi-common'

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
    let appLabels = { appClass: 'indexer' }

    const indexerDbName = 'indexer-db'
    const indexerDb = new PostgresServiceDeployment(
      indexerDbName,
      {
        namespaceName: args.namespaceName,
        env: [
          { name: 'POSTGRES_USER', value: process.env.DB_USER! },
          { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
          { name: 'POSTGRES_DB', value: process.env.INDEXER_DB_NAME! },
        ],
        storage: args.storage,
      },
      { parent: this }
    )

    const indexerMigrationJob = new k8s.batch.v1.Job(
      'indexer-db-migration',
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
                      value: indexerDbName,
                    },
                    {
                      name: 'DB_HOST',
                      value: indexerDbName,
                    },
                    { name: 'WARTHOG_DB_DATABASE', value: process.env.INDEXER_DB_NAME! },
                    { name: 'DB_NAME', value: process.env.INDEXER_DB_NAME! },
                    { name: 'DB_PASS', value: process.env.DB_PASS! },
                  ],
                  command: ['/bin/sh', '-c'],
                  args: ['yarn workspace query-node-root db:prepare; yarn workspace query-node-root db:migrate'],
                },
              ],
              restartPolicy: 'Never',
            },
          },
        },
      },
      { parent: this, dependsOn: indexerDb.service }
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
                    { name: 'DB_NAME', value: process.env.INDEXER_DB_NAME! },
                    { name: 'DB_PASS', value: process.env.DB_PASS! },
                    { name: 'DB_USER', value: process.env.DB_USER! },
                    { name: 'DB_PORT', value: process.env.DB_PORT! },
                    { name: 'INDEXER_WORKERS', value: '5' },
                    { name: 'REDIS_URI', value: 'redis://localhost:6379/0' },
                    { name: 'DEBUG', value: 'index-builder:*' },
                    { name: 'WS_PROVIDER_ENDPOINT_URI', value: process.env.WS_PROVIDER_ENDPOINT_URI! },
                    { name: 'TYPES_JSON', value: 'types.json' },
                    { name: 'PGUSER', value: process.env.DB_USER! },
                    { name: 'BLOCK_HEIGHT', value: process.env.BLOCK_HEIGHT! },
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
                    { name: 'WARTHOG_STARTER_DB_DATABASE', value: process.env.INDEXER_DB_NAME! },
                    { name: 'WARTHOG_STARTER_DB_HOST', value: indexerDbName },
                    { name: 'WARTHOG_STARTER_DB_PASSWORD', value: process.env.DB_PASS! },
                    { name: 'WARTHOG_STARTER_DB_PORT', value: process.env.DB_PORT! },
                    { name: 'WARTHOG_STARTER_DB_USERNAME', value: process.env.DB_USER! },
                    { name: 'WARTHOG_STARTER_REDIS_URI', value: 'redis://localhost:6379/0' },
                    { name: 'WARTHOG_APP_PORT', value: process.env.WARTHOG_APP_PORT! },
                    { name: 'PORT', value: process.env.WARTHOG_APP_PORT! },
                    { name: 'DEBUG', value: '*' },
                  ],
                  ports: [{ name: 'hydra-port', containerPort: Number(process.env.WARTHOG_APP_PORT!) }],
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
      { parent: this, dependsOn: indexerMigrationJob }
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
  storage: Number
}
