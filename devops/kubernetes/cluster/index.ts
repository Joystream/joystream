import * as awsx from '@pulumi/awsx'
import * as aws from '@pulumi/aws'
import * as eks from '@pulumi/eks'
import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

const awsConfig = new pulumi.Config('aws')
const config = new pulumi.Config()

const numberOfAvailabilityZones = parseInt(config.get('numberOfAvailabilityZones') || '2')
const clusterName = config.get('clusterName') || 'eksctl-joystream'
const instanceType = (config.get('instanceType') || 't2.medium') as pulumi.Input<aws.ec2.InstanceType>

export let kubeconfig: pulumi.Output<any>
export let provider: k8s.Provider
export let platform = config.require('platform')

if (platform === 'minikube') {
  provider = new k8s.Provider('local', {})
} else if (platform === 'aws') {
  // Create a VPC for our cluster.
  const vpc = new awsx.ec2.Vpc(`${clusterName}-vpc`, { numberOfAvailabilityZones, numberOfNatGateways: 1 })

  // Create an EKS cluster with the default configuration.
  const cluster = new eks.Cluster(clusterName, {
    vpcId: vpc.id,
    subnetIds: vpc.publicSubnetIds,
    instanceType: instanceType,
    providerCredentialOpts: {
      profileName: awsConfig.get('profile'),
    },
  })
  provider = cluster.provider

  // Export the cluster's kubeconfig.
  kubeconfig = cluster.kubeconfig
}
