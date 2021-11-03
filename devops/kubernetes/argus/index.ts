import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as docker from '@pulumi/docker'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { CaddyServiceDeployment } from 'pulumi-common'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const queryNodeHost = config.require('queryNodeHost')
const lbReady = config.get('isLoadBalancerReady') === 'true'
const name = 'argus-node'
const isMinikube = config.getBoolean('isMinikube')

export let kubeconfig: pulumi.Output<any>
export let argusImage: pulumi.Output<string>
let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})
  // Create image from local app
  argusImage = new docker.Image('joystream/distributor-node', {
    build: {
      context: '../../../',
      dockerfile: '../../../distributor-node.Dockerfile',
    },
    imageName: 'joystream/distributor-node:latest',
    skipPush: true,
  }).baseImageName

  // Uncomment the below line to use an existing image
  // argusImage = pulumi.interpolate`joystream/distributor-node:latest`
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('argus-vpc', { numberOfAvailabilityZones: 2, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-argus-node', {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    desiredCapacity: 2,
    maxSize: 2,
    instanceType: 't2.medium',
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig

  // Create a repository
  const repo = new awsx.ecr.Repository('distributor-node')

  // Build an image and publish it to our ECR repository.
  argusImage = repo.buildAndPushImage({
    dockerfile: '../../../distributor-node.Dockerfile',
    context: '../../../',
  })

  // Uncomment the below line to use an existing image
  // argusImage = pulumi.interpolate`ahhda/distributor-node:latest`
}

const resourceOptions = { provider: provider }

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

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
              name: 'argus',
              image: argusImage,
              imagePullPolicy: 'IfNotPresent',
              env: [
                {
                  name: 'JOYSTREAM_DISTRIBUTOR__ENDPOINTS__QUERY_NODE',
                  value: queryNodeHost,
                },
              ],
              args: ['start'],
              ports: [{ containerPort: 3334 }],
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
      name: name,
    },
    spec: {
      type: isMinikube ? 'NodePort' : 'ClusterIP',
      ports: [{ name: 'port-1', port: 3334 }],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name
export const serviceName = service.metadata.name

// Export the Deployment name
export const deploymentName = deployment.metadata.name

export let endpoint1: pulumi.Output<string> = pulumi.interpolate``
export let endpoint2: pulumi.Output<string> = pulumi.interpolate``

const caddyEndpoints = [
  ` {
    reverse_proxy ${name}:3334
}`,
]

if (!isMinikube) {
  const caddy = new CaddyServiceDeployment(
    'caddy-proxy',
    { lbReady, namespaceName: namespaceName, caddyEndpoints },
    resourceOptions
  )

  endpoint1 = pulumi.interpolate`${caddy.primaryEndpoint}`
  endpoint2 = pulumi.interpolate`${caddy.secondaryEndpoint}`
}
