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
const repo = new awsx.ecr.Repository('my-repo')

const redisLeader = new k8sjs.ServiceDeployment('redis-leader', {
  image: 'redis:6.0-alpine',
  ports: [6379],
})

const db = new k8sjs.ServiceDeployment('postgres-db', {
  image: 'postgres:12',
  ports: [5432],
  env: [
    { name: 'POSTGRES_USER', value: process.env.DB_USER! },
    { name: 'POSTGRES_PASSWORD', value: process.env.DB_PASS! },
    { name: 'POSTGRES_DB', value: process.env.INDEXER_DB_NAME! },
  ],
})
