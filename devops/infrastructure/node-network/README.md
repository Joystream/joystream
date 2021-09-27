# Query Node automated deployment

Deploys a Joystream node network on EKS Kubernetes cluster

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

1. Set the required configuration variables in `Pulumi.<stack>.yaml`

   ```bash
   $ pulumi config set-all --plaintext aws:region=us-east-1 --plaintext aws:profile=joystream-user \
    --plaintext numberOfValidators=2 --plaintext isMinikube=true --plaintext networkSuffix=8122 \
    --plaintext nodeImage=joystream/node:latest --plaintext encryptionKey=password
   ```

   If you want to build the stack on AWS set the `isMinikube` config to `false`

   ```bash
   $ pulumi config set isMinikube false
   ```

1. Stand up the Kubernetes cluster:

   Running `pulumi up -y` will deploy the EKS cluster. Note, provisioning a
   new EKS cluster takes between 10-15 minutes.

1. Once the stack is up and running, we will modify the Caddy config to get SSL certificate for the load balancer for AWS

   Modify the config variable `isLoadBalancerReady`

   ```bash
   $ pulumi config set isLoadBalancerReady true
   ```

   Run `pulumi up -y` to update the Caddy config

1. You can now access the endpoints using `pulumi stack output endpoint1` or `pulumi stack output endpoint2`

   The ws-rpc endpoint is `https://<ENDPOINT>/ws-rpc` and http-rpc endpoint is `https://<ENDPOINT>/http-rpc`

1. If you are using Minikube, run `minikube service node-network -n $(pulumi stack output namespaceName)`

   This will setup a proxy for your `node-network` service, which can then be accessed at
   the URL given in the output

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

   To get logs

   ```bash
   $ kubectl config set-context --current --namespace=$(pulumi stack output namespaceName)
   $ kubectl get pods
   $ kubectl logs <PODNAME> --all-containers
   ```

   To see complete pulumi stack output

   ```bash
   $ pulumi stack output
   ```

   To execute a command

   ```bash
   $ kubectl exec --stdin --tty <PODNAME> -c colossus -- /bin/bash
   ```

1. To get the chain-data and secrets, run the below command

   ```bash
   $ kubectl cp $(kubectl get pods | grep rpc-node | awk '{print $1}'):/chain-data/chain-data.7z ./chain-data.7z
   ```

1. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

   ```bash
   $ pulumi destroy --yes
   $ pulumi stack rm --yes
   ```
