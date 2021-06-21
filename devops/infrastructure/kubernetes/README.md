# Amazon EKS Cluster: Hello World!

This example deploys an EKS Kubernetes cluster with custom ipfs image

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
1. [Install Node.js](https://nodejs.org/en/download/)
1. Install a package manager for Node.js, such as [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/en/docs/install).
1. [Configure AWS Credentials](https://www.pulumi.com/docs/intro/cloud-providers/aws/setup/)
1. Optional (for debugging): [Install kubectl](https://kubernetes.io/docs/tasks/tools/)

### Steps

After cloning this repo, from this working directory, run these commands:

1. Install the required Node.js packages:

   This installs the dependent packages [needed](https://www.pulumi.com/docs/intro/concepts/how-pulumi-works/) for our Pulumi program.

   ```bash
   $ npm install
   ```

1. Create a new stack, which is an isolated deployment target for this example:

   This will initialize the Pulumi program in TypeScript.

   ```bash
   $ pulumi stack init
   ```

1. Set the required AWS configuration variables in `Pulumi.<stack>.yaml`

1. Set `WS_PROVIDER_ENDPOINT_URI` environment variable. Example `export WS_PROVIDER_ENDPOINT_URI='wss://18.209.241.63.nip.io/'`

1. Stand up the EKS cluster:

   Running `pulumi up -y` will deploy the EKS cluster. Note, provisioning a
   new EKS cluster takes between 10-15 minutes.

   ```bash
   $ pulumi update
   Previewing update (eks-demo):

       Type                                          Name                              	Plan
   +   pulumi:pulumi:Stack                           eks-hello-world-eks-demo     			create
   +   ├─ eks:index:Cluster                          helloworld                          	create
   +   │  ├─ eks:index:ServiceRole                   helloworld-eksRole                  	create
   +   │  │  ├─ aws:iam:Role                         helloworld-eksRole-role             	create
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-eksRole-90eb1c99         	create
   +   │  │  └─ aws:iam:RolePolicyAttachment         helloworld-eksRole-4b490823         	create
   +   │  ├─ eks:index:ServiceRole                   helloworld-instanceRole             	create
   +   │  │  ├─ aws:iam:Role                         helloworld-instanceRole-role        	create
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-03516f97    	create
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-e1b295bd    	create
   +   │  │  └─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-3eb088f2    	create
   +   │  ├─ pulumi-nodejs:dynamic:Resource          helloworld-cfnStackName             	create
   +   │  ├─ aws:ec2:SecurityGroup                   helloworld-eksClusterSecurityGroup  	create
   +   │  ├─ aws:iam:InstanceProfile                 helloworld-instanceProfile          	create
   +   │  ├─ aws:eks:Cluster                         helloworld-eksCluster               	create
   +   │  ├─ pulumi-nodejs:dynamic:Resource          helloworld-vpc-cni                  	create
   +   │  ├─ pulumi:providers:kubernetes             helloworld-eks-k8s                  	create
   +   │  ├─ aws:ec2:SecurityGroup                   helloworld-nodeSecurityGroup        	create
   +   │  ├─ kubernetes:core:ConfigMap               helloworld-nodeAccess               	create
   +   │  ├─ kubernetes:storage.k8s.io:StorageClass  helloworld-gp2                      	create
   +   │  ├─ aws:ec2:SecurityGroupRule               helloworld-eksClusterIngressRule    	create
   +   │  ├─ aws:ec2:LaunchConfiguration             helloworld-nodeLaunchConfiguration  	create
   +   │  ├─ aws:cloudformation:Stack                helloworld-nodes                    	create
   +   │  └─ pulumi:providers:kubernetes             helloworld-provider                 	create
   +   └─ aws-infra:network:Network                  vpc                               	create
   +      ├─ aws:ec2:Vpc                             vpc                               	create
   +      ├─ aws:ec2:Eip                             vpc-nat-0                         	create
   +      ├─ aws:ec2:Eip                             vpc-nat-1                         	create
   +      ├─ aws:ec2:InternetGateway                 vpc                               	create
   +      ├─ aws:ec2:Subnet                          vpc-nat-1                         	create
   +      ├─ aws:ec2:Subnet                          vpc-0                             	create
   +      ├─ aws:ec2:Subnet                          vpc-nat-0                         	create
   +      ├─ aws:ec2:Subnet                          vpc-1                             	create
   +      ├─ aws:ec2:RouteTable                      vpc                               	create
   +      ├─ aws:ec2:NatGateway                      vpc-nat-1                         	create
   +      ├─ aws:ec2:RouteTableAssociation           vpc-nat-1                         	create
   +      ├─ aws:ec2:NatGateway                      vpc-nat-0                         	create
   +      ├─ aws:ec2:RouteTableAssociation           vpc-nat-0                         	create
   +      ├─ aws:ec2:RouteTable                      vpc-nat-1                         	create
   +      ├─ aws:ec2:RouteTable                      vpc-nat-0                         	create
   +      ├─ aws:ec2:RouteTableAssociation           vpc-1                             	create
   +      └─ aws:ec2:RouteTableAssociation           vpc-0                             	create

   Resources:
       + 42 to create

   clusterng (eks-demo):

       Type                                          Name                              	Status      Info
   +   pulumi:pulumi:Stack                           eks-hello-world-eks-demo     			created
   +   ├─ eks:index:Cluster                          helloworld                          	created
   +   │  ├─ eks:index:ServiceRole                   helloworld-eksRole                  	created
   +   │  │  ├─ aws:iam:Role                         helloworld-eksRole-role             	created
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-eksRole-90eb1c99         	created
   +   │  │  └─ aws:iam:RolePolicyAttachment         helloworld-eksRole-4b490823         	created
   +   │  ├─ eks:index:ServiceRole                   helloworld-instanceRole             	created
   +   │  │  ├─ aws:iam:Role                         helloworld-instanceRole-role        	created
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-3eb088f2    	created
   +   │  │  ├─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-03516f97    	created
   +   │  │  └─ aws:iam:RolePolicyAttachment         helloworld-instanceRole-e1b295bd    	created
   +   │  ├─ pulumi-nodejs:dynamic:Resource          helloworld-cfnStackName             	created
   +   │  ├─ aws:iam:InstanceProfile                 helloworld-instanceProfile          	created
   +   │  ├─ aws:ec2:SecurityGroup                   helloworld-eksClusterSecurityGroup  	created
   +   │  ├─ aws:eks:Cluster                         helloworld-eksCluster               	created
   +   │  ├─ pulumi:providers:kubernetes             helloworld-eks-k8s                  	created
   +   │  ├─ pulumi-nodejs:dynamic:Resource          helloworld-vpc-cni                  	created
   +   │  ├─ aws:ec2:SecurityGroup                   helloworld-nodeSecurityGroup        	created
   +   │  ├─ kubernetes:core:ConfigMap               helloworld-nodeAccess               	created
   +   │  ├─ kubernetes:storage.k8s.io:StorageClass  helloworld-gp2                      	created
   +   │  ├─ aws:ec2:SecurityGroupRule               helloworld-eksClusterIngressRule    	created
   +   │  ├─ aws:ec2:LaunchConfiguration             helloworld-nodeLaunchConfiguration  	created
   +   │  ├─ aws:cloudformation:Stack                helloworld-nodes                    	created
   +   │  └─ pulumi:providers:kubernetes             helloworld-provider                 	created
   +   └─ aws-infra:network:Network                  vpc                               	created
   +      ├─ aws:ec2:Vpc                             vpc                               	created
   +      ├─ aws:ec2:Eip                             vpc-nat-0                         	created
   +      ├─ aws:ec2:Eip                             vpc-nat-1                         	created
   +      ├─ aws:ec2:InternetGateway                 vpc                               	created
   +      ├─ aws:ec2:Subnet                          vpc-nat-1                         	created
   +      ├─ aws:ec2:Subnet                          vpc-0                             	created
   +      ├─ aws:ec2:Subnet                          vpc-nat-0                         	created
   +      ├─ aws:ec2:Subnet                          vpc-1                             	created
   +      ├─ aws:ec2:RouteTable                      vpc                               	created
   +      ├─ aws:ec2:NatGateway                      vpc-nat-1                         	created
   +      ├─ aws:ec2:NatGateway                      vpc-nat-0                         	created
   +      ├─ aws:ec2:RouteTableAssociation           vpc-nat-0                         	created
   +      ├─ aws:ec2:RouteTableAssociation           vpc-nat-1                         	created
   +      ├─ aws:ec2:RouteTable                      vpc-nat-1                         	created
   +      ├─ aws:ec2:RouteTableAssociation           vpc-1                             	created
   +      ├─ aws:ec2:RouteTable                      vpc-nat-0                         	created
   +      └─ aws:ec2:RouteTableAssociation           vpc-0                             	created

   Diagnostics:
   pulumi:pulumi:Stack (eks-hello-world-eks-demo):

   Outputs:
       kubeconfig: {
           apiVersion     : "v1"
           clusters       : [
               [0]: {
                   cluster: {
                       certificate-authority-data: "<CERT_DATA>"
                       server                    : "https://<SERVER_ADDR>.us-west-2.eks.amazonaws.com"
                   }
                   name   : "kubernetes"
               }
           ]
           contexts       : [
               [0]: {
                   context: {
                       cluster: "kubernetes"
                       user   : "aws"
                   }
                   name   : "aws"
               }
           ]
           current-context: "aws"
           kind           : "Config"
           users          : [
               [0]: {
                   name: "aws"
                   user: {
                       exec: {
                           apiVersion: "client.authentication.k8s.io/v1alpha1"
                           args      : [
                               [0]: "token"
                               [1]: "-i"
                               [2]: "helloworld-eksCluster-e9e1711"
                           ]
                           command   : "aws-iam-authenticator"
                       }
                   }
               }
           ]
       }

   Resources:
       + 42 created

   Duration: 13m7s
   ```

1. Access the Kubernetes Cluster using `kubectl`

   To access your new Kubernetes cluster using `kubectl`, we need to set up the
   `kubeconfig` file and download `kubectl`. We can leverage the Pulumi
   stack output in the CLI, as Pulumi facilitates exporting these objects for us.

   ```bash
   $ pulumi stack output kubeconfig --show-secrets > kubeconfig
   $ export KUBECONFIG=$PWD/kubeconfig
   $ kubectl get nodes
   ```

   We can also use the stack output to query the cluster for our newly created Deployment:

   ```bash
   $ kubectl get deployment $(pulumi stack output deploymentName) --namespace=$(pulumi stack output namespaceName)
   $ kubectl get service $(pulumi stack output serviceName) --namespace=$(pulumi stack output namespaceName)
   ```

   By deploying the NGINX image in this way, it is outside of Pulumi's control. But this is simply to show that we can control our cluster via the CLI as well.

1. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

   ```bash
   $ pulumi destroy --yes
   $ pulumi stack rm --yes
   ```
