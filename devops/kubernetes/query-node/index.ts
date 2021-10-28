import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as docker from '@pulumi/docker'
import * as pulumi from '@pulumi/pulumi'
import { configMapFromFile } from './configMap'
import * as k8s from '@pulumi/kubernetes'
import * as s3Helpers from './s3Helpers'
import { CaddyServiceDeployment, PostgresServiceDeployment } from 'pulumi-common'

require('dotenv').config()

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')
const isMinikube = config.getBoolean('isMinikube')
const externalIndexerUrl = config.get('externalIndexerUrl')
const skipProcessor = config.getBoolean('skipProcessor')
export let kubeconfig: pulumi.Output<any>
export let joystreamAppsImage: pulumi.Output<string>
let provider: k8s.Provider

if (skipProcessor && externalIndexerUrl) {
  pulumi.log.error('Need to deploy atleast one component, Indexer or Processor')
  throw new Error(`Please check the config settings for skipProcessor and externalIndexerUrl`)
}

if (isMinikube) {
  provider = new k8s.Provider('local', {})

  // Create image from local app
  joystreamAppsImage = new docker.Image('joystream/apps', {
    build: {
      context: '../../../',
      dockerfile: '../../../apps.Dockerfile',
    },
    imageName: 'joystream/apps:latest',
    skipPush: true,
  }).baseImageName

  // Uncomment the below line if you want to use a pre built image
  // joystreamAppsImage = pulumi.interpolate`joystream/apps`
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('query-node-vpc', { numberOfAvailabilityZones: 2, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-query-node', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    desiredCapacity: 3,
    maxSize: 3,
    instanceType: 't2.large',
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig

  // Create a repository
  const repo = new awsx.ecr.Repository('joystream/apps')

  joystreamAppsImage = repo.buildAndPushImage({
    dockerfile: '../../../apps.Dockerfile',
    context: '../../../',
  })

  // Uncomment the below line if you want to use a pre built image
  // joystreamAppsImage = pulumi.interpolate`joystream/apps`
}

const resourceOptions = { provider: provider }

const name = 'query-node'

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

let appLabels = { appClass: name }

const defsConfig = new configMapFromFile(
  'defs-config',
  {
    filePath: '../../../types/augment/all/defs.json',
    namespaceName: namespaceName,
  },
  resourceOptions
).configName

if (!externalIndexerUrl) {
  const indexerDbName = 'indexer-db'
  const indexerDb = new PostgresServiceDeployment(
    indexerDbName,
    {
      namespaceName: namespaceName,
      env: [
        { name: 'POSTGRES_USER', value: process.env.DB_USER! },
        { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
        { name: 'POSTGRES_DB', value: process.env.INDEXER_DB_NAME! },
      ],
      storage: 10,
    },
    resourceOptions
  )

  const indexerMigrationJob = new k8s.batch.v1.Job(
    'db-migration',
    {
      metadata: {
        namespace: namespaceName,
      },
      spec: {
        backoffLimit: 0,
        template: {
          spec: {
            containers: [
              {
                name: 'db-migration',
                image: joystreamAppsImage,
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
    { ...resourceOptions, dependsOn: indexerDb.service }
  )

  appLabels = { appClass: 'indexer' }

  const indexerDeployment = new k8s.apps.v1.Deployment(
    'indexer',
    {
      metadata: {
        namespace: namespaceName,
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
                  name: defsConfig,
                },
              },
            ],
          },
        },
      },
    },
    { ...resourceOptions, dependsOn: indexerMigrationJob }
  )

  // Create a Service for the Indexer
  const indexerService = new k8s.core.v1.Service(
    'indexer',
    {
      metadata: {
        labels: appLabels,
        namespace: namespaceName,
        name: 'indexer',
      },
      spec: {
        ports: [{ name: 'port-1', port: 4000, targetPort: 'hydra-port' }],
        selector: appLabels,
      },
    },
    resourceOptions
  )
}

if (!skipProcessor) {
  const processorDbName = 'processor-db'
  const processorDb = new PostgresServiceDeployment(
    processorDbName,
    {
      namespaceName: namespaceName,
      env: [
        { name: 'POSTGRES_USER', value: process.env.DB_USER! },
        { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
        { name: 'POSTGRES_DB', value: process.env.DB_NAME! },
      ],
      storage: 10,
    },
    resourceOptions
  )

  const processorMigrationJob = new k8s.batch.v1.Job(
    'processor-db-migration',
    {
      metadata: {
        namespace: namespaceName,
      },
      spec: {
        backoffLimit: 0,
        template: {
          spec: {
            containers: [
              {
                name: 'db-migration',
                image: joystreamAppsImage,
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
                  { name: 'WARTHOG_DB_DATABASE', value: process.env.DB_NAME! },
                  { name: 'DB_NAME', value: process.env.DB_NAME! },
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
    { ...resourceOptions, dependsOn: processorDb.service }
  )

  appLabels = { appClass: 'graphql-server' }

  const graphqlDeployment = new k8s.apps.v1.Deployment(
    'graphql-server',
    {
      metadata: {
        namespace: namespaceName,
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
                image: joystreamAppsImage,
                imagePullPolicy: 'IfNotPresent',
                env: [
                  { name: 'DB_HOST', value: processorDbName },
                  { name: 'DB_PASS', value: process.env.DB_PASS! },
                  { name: 'DB_USER', value: process.env.DB_USER! },
                  { name: 'DB_PORT', value: process.env.DB_PORT! },
                  { name: 'DB_NAME', value: process.env.DB_NAME! },
                  { name: 'GRAPHQL_SERVER_HOST', value: process.env.GRAPHQL_SERVER_HOST! },
                  { name: 'GRAPHQL_SERVER_PORT', value: process.env.GRAPHQL_SERVER_PORT! },
                  { name: 'WS_PROVIDER_ENDPOINT_URI', value: process.env.WS_PROVIDER_ENDPOINT_URI! },
                ],
                ports: [{ name: 'graph-ql-port', containerPort: Number(process.env.GRAPHQL_SERVER_PORT!) }],
                args: ['workspace', 'query-node-root', 'query-node:start:prod'],
              },
            ],
          },
        },
      },
    },
    { ...resourceOptions, dependsOn: processorMigrationJob }
  )

  // Create a Service for the GraphQL Server
  const graphqlService = new k8s.core.v1.Service(
    'graphql-server',
    {
      metadata: {
        labels: appLabels,
        namespace: namespaceName,
        name: 'graphql-server',
      },
      spec: {
        ports: [{ name: 'port-1', port: 8081, targetPort: 'graph-ql-port' }],
        selector: appLabels,
      },
    },
    resourceOptions
  )

  const indexerURL = externalIndexerUrl || `http://indexer:4000/graphql`
  appLabels = { appClass: 'processor' }

  const processorDeployment = new k8s.apps.v1.Deployment(
    `processor`,
    {
      metadata: {
        namespace: namespaceName,
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
                image: joystreamAppsImage,
                imagePullPolicy: 'IfNotPresent',
                env: [
                  {
                    name: 'INDEXER_ENDPOINT_URL',
                    value: indexerURL,
                  },
                  { name: 'TYPEORM_HOST', value: processorDbName },
                  { name: 'TYPEORM_DATABASE', value: process.env.DB_NAME! },
                  { name: 'DEBUG', value: 'index-builder:*' },
                  { name: 'PROCESSOR_POLL_INTERVAL', value: '1000' },
                ],
                volumeMounts: [
                  {
                    mountPath: '/joystream/query-node/mappings/lib/generated/types/typedefs.json',
                    name: 'processor-volume',
                    subPath: 'fileData',
                  },
                ],
                command: ['/bin/sh', '-c'],
                args: ['cd query-node && yarn hydra-processor run -e ../.env'],
              },
            ],
            volumes: [
              {
                name: 'processor-volume',
                configMap: {
                  name: defsConfig,
                },
              },
            ],
          },
        },
      },
    },
    { ...resourceOptions, dependsOn: graphqlService }
  )
}

const caddyEndpoints = [
  `/indexer* {
    uri strip_prefix /indexer
    reverse_proxy indexer:4000
}`,
  `/server* {
    uri strip_prefix /server
    reverse_proxy graphql-server:8081
}`,
]

const lbReady = config.get('isLoadBalancerReady') === 'true'

export let endpoint1: pulumi.Output<string>
export let endpoint2: pulumi.Output<string>

if (!isMinikube) {
  const caddy = new CaddyServiceDeployment(
    'caddy-proxy',
    { lbReady, namespaceName: namespaceName, isMinikube, caddyEndpoints },
    resourceOptions
  )

  endpoint1 = pulumi.interpolate`${caddy.primaryEndpoint}`
  endpoint2 = pulumi.interpolate`${caddy.secondaryEndpoint}`
}
