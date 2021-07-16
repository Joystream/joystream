import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')
const isMinikube = config.getBoolean('isMinikube')
export let kubeconfig: pulumi.Output<any>
export let joystreamAppsImage: pulumi.Output<string>
let provider: k8s.Provider

if (isMinikube) {
  provider = new k8s.Provider('local', {})

  // Create image from local app
  // joystreamAppsImage = new docker.Image('joystream/apps', {
  //   build: {
  //     context: '../../../',
  //     dockerfile: '../../../apps.Dockerfile',
  //   },
  //   imageName: 'joystream/apps:latest',
  //   skipPush: true,
  // }).baseImageName
  // joystreamAppsImage = pulumi.interpolate`joystream/apps`
} else {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('joystream-node-vpc', { numberOfAvailabilityZones: 2 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-my-cluster', {
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
}

const resourceOptions = { provider: provider }

const name = 'node-network'

// Create a Kubernetes Namespace
// const ns = new k8s.core.v1.Namespace(name, {}, { provider: cluster.provider })
const ns = new k8s.core.v1.Namespace(name, {}, resourceOptions)

// Export the Namespace name
export const namespaceName = ns.metadata.name

const appLabels = { appClass: name }

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
              name: 'joystream-node',
              image: 'joystream/node:latest',
              ports: [{ containerPort: 9944 }, { containerPort: 9933 }],
            },
          ],
          volumes: [],
        },
      },
    },
  },
  { ...resourceOptions }
)

// Export the Deployment name
export const deploymentName = deployment.metadata.name

// Create a LoadBalancer Service for the NGINX Deployment
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
      name: 'query-node',
    },
    spec: {
      ports: [
        { name: 'port-1', port: 9944 },
        { name: 'port-2', port: 9933 },
      ],
      selector: appLabels,
    },
  },
  resourceOptions
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name

// When "done", this will print the public IP.
export let serviceHostname: pulumi.Output<string>

serviceHostname = service.status.loadBalancer.ingress[0].hostname
