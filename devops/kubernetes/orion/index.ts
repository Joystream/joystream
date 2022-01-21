import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { CaddyServiceDeployment } from 'pulumi-common'
import { MongoDBServiceDeployment } from './mongo'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const name = 'orion'

const queryNodeHost = config.require('queryNodeEndpoint')
const lbReady = config.get('isLoadBalancerReady') === 'true'
const orionImage = config.get('orionImage') || `joystream/orion:latest`
const contentSecret = config.get('contentSecret') || `password123`
const storage = parseInt(config.get('storage') || '40')
const isMinikube = config.getBoolean('isMinikube')

export let kubeconfig: pulumi.Output<any>
let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('orion-vpc', { numberOfAvailabilityZones: 2, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-orion-node', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    instanceType: 't2.medium',
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig
}

const resourceOptions = { provider: provider }

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

const mongoDb = new MongoDBServiceDeployment(
  'mongo-db',
  {
    namespaceName: namespaceName,
    storage: storage,
  },
  resourceOptions
)

// Create a Deployment
const deployment = new k8s.apps.v1.Deployment(
  name,
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
              name: 'orion',
              image: orionImage,
              imagePullPolicy: 'IfNotPresent',
              env: [
                {
                  name: 'ORION_PORT',
                  value: '6116',
                },
                {
                  name: 'ORION_MONGO_HOSTNAME',
                  value: mongoDb.service.metadata.name,
                },
                {
                  name: 'ORION_FEATURED_CONTENT_SECRET',
                  value: contentSecret,
                },
                {
                  name: 'ORION_QUERY_NODE_URL',
                  value: queryNodeHost,
                },
              ],
              ports: [{ containerPort: 6116 }],
            },
          ],
        },
      },
    },
  },
  resourceOptions
)

// Create a LoadBalancer Service for the Deployment
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
      name: 'orion-node',
    },
    spec: {
      type: isMinikube ? 'NodePort' : 'ClusterIP',
      ports: [{ name: 'port-1', port: 6116 }],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name
export const serviceName = service.metadata.name

// Export the Deployment name
export const deploymentName = deployment.metadata.name

const caddyEndpoints = [
  ` {
    reverse_proxy orion-node:6116
}`,
]

export let endpoint1: pulumi.Output<string> = pulumi.interpolate``
export let endpoint2: pulumi.Output<string> = pulumi.interpolate``

if (!isMinikube) {
  const caddy = new CaddyServiceDeployment(
    'caddy-proxy',
    { lbReady, namespaceName: namespaceName, caddyEndpoints },
    resourceOptions
  )

  endpoint1 = pulumi.interpolate`${caddy.primaryEndpoint}`
  endpoint2 = pulumi.interpolate`${caddy.secondaryEndpoint}`
}
