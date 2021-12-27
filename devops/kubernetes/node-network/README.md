# Query Node automated deployment

Deploys a Joystream node network on a Kubernetes cluster

## Deploying the App

To deploy your infrastructure, follow the below steps.

### Prerequisites

1. [Install Pulumi](https://www.pulumi.com/docs/get-started/install/)
1. [Install Node.js](https://nodejs.org/en/download/)
1. Install a package manager for Node.js, such as [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/en/docs/install).
1. [Configure AWS Credentials](https://www.pulumi.com/docs/intro/cloud-providers/aws/setup/)
1. Optional (for debugging): [Install kubectl](https://kubernetes.io/docs/tasks/tools/)

### Steps

Make sure you have already created a Kubernetes cluster. Refer to the README in the `cluster` folder.
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
   $ pulumi config set-all --plaintext numberOfValidators=2 --plaintext networkSuffix=8122 \
    --plaintext nodeImage=joystream/node:latest --plaintext encryptionKey=password
   ```

   Set the `clusterStackRef` config variable based on the name of the stack used to deploy the cluster.

   If you are logged in to the Pulumi CLI use the below format:

   ```bash
   $ pulumi config set clusterStackRef <USERNAME>/kubernetes-cluster/<STACK_NAME>
   ```

   If you are using Pulumi local (`pulumi login -l`), use the below format:

   ```bash
   $ pulumi config set clusterStackRef <STACK_NAME>
   ```

   If you are using an already deployed cluster, save the Kubeconfig as a file and set the `kubeconfigFile` config

   ```bash
   $ pulumi config set kubeconfigFile <PATH>
   ```

1. Stand up the deployments:

   Running `pulumi up -y` will deploy the stack on your platform's Kubernetes cluster

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
