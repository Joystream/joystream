import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

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
const repo = new awsx.ecr.Repository('my-repo')

// Build an image and publish it to our ECR repository.

export const colossusImage = repo.buildAndPushImage({
  dockerfile: '../../../colossus.Dockerfile',
  context: '../../../',
})

const name = 'storage-node'

// Create a Kubernetes Namespace
const ns = new k8s.core.v1.Namespace(name, {}, { provider: cluster.provider })

// Export the Namespace name
export const namespaceName = ns.metadata.name

// Create a NGINX Deployment
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
              name: 'ipfs',
              image: 'ipfs/go-ipfs:latest',
              ports: [{ containerPort: 5001 }, { containerPort: 8080 }],
            },
            {
              name: 'colossus',
              image: colossusImage,
              env: [
                {
                  name: 'WS_PROVIDER_ENDPOINT_URI',
                  // example 'wss://18.209.241.63.nip.io/'
                  value: process.env.WS_PROVIDER_ENDPOINT_URI,
                },
                {
                  name: 'DEBUG',
                  value: '*',
                },
              ],
              command: [
                'yarn',
                'colossus',
                '--dev',
                '--ws-provider',
                '$(WS_PROVIDER_ENDPOINT_URI)',
                '--ipfs-host',
                'ipfs',
              ],
              ports: [{ containerPort: 3001 }],
            },
          ],
        },
      },
    },
  },
  {
    provider: cluster.provider,
  }
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
    },
    spec: {
      type: 'LoadBalancer',
      ports: [
        { name: 'port-1', port: 5001 },
        { name: 'port-2', port: 8080 },
        { name: 'port-3', port: 3001 },
      ],
      selector: appLabels,
    },
  },
  {
    provider: cluster.provider,
  }
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name
export const serviceHostname = service.status.loadBalancer.ingress[0].hostname
