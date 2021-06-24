import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
// import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import * as k8sjs from './k8sjs'

require('dotenv').config()

const awsConfig = new pulumi.Config('aws')

// Create a VPC for our cluster.
const vpc = new awsx.ec2.Vpc('vpc', { numberOfAvailabilityZones: 2 })

// Create an EKS cluster with the default configuration.
const cluster = new eks.Cluster('eksctl-my-cluster', {
  vpcId: vpc.id,
  subnetIds: vpc.publicSubnetIds,
  instanceType: 't2.micro',
  providerCredentialOpts: {
    profileName: awsConfig.get('profile'),
  },
})

// Export the cluster's kubeconfig.
export const kubeconfig = cluster.kubeconfig

// Create a repository
const repo = new awsx.ecr.Repository('joystream/apps')

export const joystreamAppsImage = repo.buildAndPushImage({
  dockerfile: '../../../apps.Dockerfile',
  context: '../../../',
})

const redis = new k8sjs.ServiceDeployment('redis', {
  image: 'redis:6.0-alpine',
  ports: [6379],
  provider: cluster.provider,
})

const db = new k8sjs.ServiceDeployment('postgres-db', {
  image: 'postgres:12',
  ports: [5432],
  provider: cluster.provider,
  env: [
    { name: 'POSTGRES_USER', value: process.env.DB_USER! },
    { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
    { name: 'POSTGRES_DB', value: process.env.INDEXER_DB_NAME! },
  ],
  allocateIpAddress: false,
})

const indexer = new k8sjs.ServiceDeployment('indexer', {
  image: 'joystream/hydra-indexer:2.1.0-beta.9',
  provider: cluster.provider,
  env: [
    { name: 'DB_HOST', value: 'postgres-db' },
    { name: 'DB_NAME', value: process.env.INDEXER_DB_NAME! },
    { name: 'INDEXER_WORKERS', value: '5' },
    { name: 'REDIS_URI', value: 'redis://redis:6379/0' },
    { name: 'DEBUG', value: 'index-builder:*' },
    { name: 'WS_PROVIDER_ENDPOINT_URI', value: process.env.WS_PROVIDER_ENDPOINT_URI! },
    { name: 'TYPES_JSON', value: 'types.json' },
  ],
  command: ['yarn db:bootstrap && yarn start:prod'],
  allocateIpAddress: false,
})

const hydraIndexerGateway = new k8sjs.ServiceDeployment('hydra-indexer-gateway', {
  image: 'joystream/hydra-indexer:2.1.0-beta.9',
  ports: [5432],
  provider: cluster.provider,
  env: [
    { name: 'POSTGRES_USER', value: process.env.DB_USER! },
    { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
    { name: 'POSTGRES_DB', value: process.env.INDEXER_DB_NAME! },
  ],
  allocateIpAddress: false,
})

const processor = new k8sjs.ServiceDeployment('processor', {
  image: joystreamAppsImage,
  provider: cluster.provider,
  env: [
    { name: 'INDEXER_ENDPOINT_URL', value: `http://hydra-indexer-gateway:${process.env.WARTHOG_APP_PORT}/graphql` },
    { name: 'TYPEORM_HOST', value: 'postgres-db' },
    { name: 'TYPEORM_DATABASE', value: process.env.DB_NAME! },
    { name: 'DEBUG', value: 'index-builder:*' },
    { name: 'PROCESSOR_POLL_INTERVAL', value: '1000' },
  ],
  volumeMounts: [
    {
      mountPath: '/joystream/query-node/mappings/lib/generated/types/typedefs.json',
      name: 'tmp-volume',
    },
  ],
  volumes: [
    {
      name: 'tmp-volume',
      hostPath: {
        path: '../../../types/augment/all/defs.json',
        type: 'FileOrCreate',
      },
    },
  ],
  allocateIpAddress: false,
})

const graphqlServer = new k8sjs.ServiceDeployment('graphql-server', {
  image: joystreamAppsImage,
  ports: [Number(process.env.GRAPHQL_SERVER_PORT!)],
  provider: cluster.provider,
  env: [
    { name: 'DB_HOST', value: 'postgres-db' },
    { name: 'DB_NAME', value: process.env.DB_NAME! },
  ],
  allocateIpAddress: true,
})
