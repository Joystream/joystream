import * as awsx from '@pulumi/awsx'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

export let kubeconfig: pulumi.Output<any>
export let provider: k8s.Provider
export let platform = config.require('platform')

if (platform === 'minikube') {
  provider = new k8s.Provider('local', {})
} else if (platform === 'aws') {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc('kubernetes-vpc', { numberOfAvailabilityZones: 2, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster('eksctl-joystream', {
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
