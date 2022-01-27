# Query Node automated deployment

Deploys an EKS Kubernetes cluster with query node

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
    --plaintext dbPassword=password --plaintext blockHeight=0 \
    --plaintext joystreamWsEndpoint=ws://endpoint.somewhere.net:9944 \
    --plaintext isMinikube=true --plaintext skipProcessor=false
   ```

   If you want to build the stack on AWS set the `isMinikube` config to `false`

   ```bash
   $ pulumi config set isMinikube false
   ```

   If you want to use an existing Indexer and not deploy a new one set `externalIndexerUrl`

   ```bash
   $ pulumi config set externalIndexerUrl <URL>
   ```

   You must have a valid docker image of `joystream/apps` either on Docker hub or your local to deploy the infrastructure.
   If the image exists locally & you are running on minikube, run

   ```bash
   $ pulumi config set-all --plaintext useLocalRepo=true --plaintext appsImage=<IMAGE_NAME>
   ```

   NOTE: The docker deamon for minikube is different from that of the docker desktop. To connect your Docker CLI to the docker
   daemon inside the VM you need to run: `eval $(minikube docker-env)`. To copy the image from your local deamon to minikube run
   `minikube image load joystream/apps:latest --daemon`.

   If not using minikube, just specify the `appsImage` config.

1. Stand up the Kubernetes cluster:

   Running `pulumi up -y` will deploy the EKS cluster. Note, provisioning a
   new EKS cluster takes between 10-15 minutes.

1. Once the stack is up and running, we will modify the Caddy config to get SSL certificate for the load balancer

   Modify the config variable `isLoadBalancerReady`

   ```bash
   $ pulumi config set isLoadBalancerReady true
   ```

   Run `pulumi up -y` to update the Caddy config

1. You can now access the endpoints using `pulumi stack output endpoint1` or `pulumi stack output endpoint2`

   The GraphQl server is accessible at `https://<ENDPOINT>/server/graphql` and indexer at `https://<ENDPOINT>/indexer/graphql`

1. If you are using Minikube, run `minikube service graphql-server -n $(pulumi stack output namespaceName)`

   This will setup a proxy for your `query-node` service, which can then be accessed at
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

1. Once you've finished experimenting, tear down your stack's resources by destroying and removing it:

   ```bash
   $ pulumi destroy --yes
   $ pulumi stack rm --yes
   ```
