import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const wsProviderEndpointURI = config.require('wsProviderEndpointURI')
const isProduction = config.require('isProduction') === 'true'

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
const repo = new awsx.ecr.Repository('colossus-image')

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

const appLabels = { appClass: name }

// Create a LoadBalancer Service for the Deployment
const service = new k8s.core.v1.Service(
  name,
  {
    metadata: {
      labels: appLabels,
      namespace: namespaceName,
    },
    spec: {
      type: 'LoadBalancer',
      ports: [{ name: 'port-1', port: 3001 }],
      selector: appLabels,
    },
  },
  {
    provider: cluster.provider,
  }
)

// Export the Service name and public LoadBalancer Endpoint
export const serviceName = service.metadata.name
// When "done", this will print the public IP.
export let serviceHostname: pulumi.Output<string>
serviceHostname = service.status.loadBalancer.ingress[0].hostname
const publicUrlInput: pulumi.Input<string> = pulumi.interpolate`http://${serviceHostname}:${3001}/`

let additionalParams: string[] | pulumi.Input<string>[] = []

if (isProduction) {
  const providerId = config.require('providerId')
  const keyFile = config.require('keyFile')
  const publicUrl = config.get('publicURL') ? config.get('publicURL')! : publicUrlInput

  additionalParams = ['--provider-id', providerId, '--key-file', keyFile, '--public-url', publicUrl]

  const passphrase = config.get('passphrase')
  if (passphrase) {
    additionalParams.push('--passphrase', passphrase)
  }
}

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
          hostname: 'ipfs',
          containers: [
            {
              name: 'ipfs',
              image: 'ipfs/go-ipfs:latest',
              ports: [{ containerPort: 5001 }, { containerPort: 8080 }],
              command: ['/bin/sh', '-c'],
              args: [
                'set -e; \
                /usr/local/bin/start_ipfs config profile apply lowpower; \
                /usr/local/bin/start_ipfs config --json Gateway.PublicGateways \'{"localhost": null }\'; \
                /sbin/tini -- /usr/local/bin/start_ipfs daemon --migrate=true',
              ],
            },
            {
              name: 'colossus',
              image: colossusImage,
              env: [
                {
                  name: 'WS_PROVIDER_ENDPOINT_URI',
                  // example 'wss://18.209.241.63.nip.io/'
                  value: wsProviderEndpointURI,
                },
                {
                  name: 'DEBUG',
                  value: 'joystream:*',
                },
              ],
              command: [
                'yarn',
                'colossus',
                '--anonymous',
                '--ws-provider',
                wsProviderEndpointURI,
                '--ipfs-host',
                'ipfs',
                ...additionalParams,
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
