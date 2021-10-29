import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as docker from '@pulumi/docker'
import * as pulumi from '@pulumi/pulumi'
import { configMapFromFile } from './configMap'
import * as k8s from '@pulumi/kubernetes'
import { IndexerServiceDeployment } from './indexerDeployment'
import { ProcessorServiceDeployment } from './processorDeployment'
import { CaddyServiceDeployment } from 'pulumi-common'

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
  const indexer = new IndexerServiceDeployment(
    'indexer',
    { namespaceName, storage: 10, defsConfig, joystreamAppsImage },
    resourceOptions
  )
}

if (!skipProcessor) {
  const processor = new ProcessorServiceDeployment(
    'processor',
    { namespaceName, storage: 10, defsConfig, joystreamAppsImage, externalIndexerUrl },
    resourceOptions
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
