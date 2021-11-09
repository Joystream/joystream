### Requirements (in addition to nodejs and npm)
- kind     - https://kind.sigs.k8s.io/docs/user/quick-start/#installation
- minikube - https://minikube.sigs.k8s.io/docs/start/
- pulumi   - https://www.pulumi.com/docs/get-started/install/
- kubectl  - https://kubernetes.io/docs/tasks/tools/#kubectl 

Note that minikube works better in Mac Docker Desktop. Linux is recommended for best results.

# Minikube

### create a minikube cluster
minikube start

### deploy nginx ingress controller
minikube addons enable ingress

### check deployment succeeded
kubectl get pods --all-namespaces -l app=ingress-nginx

### load required docker images
minikube load image joystream/node:giza --daemon 

### deploy node-network or query-node pulumi stack..
```
pulumi up ...
# get the namespace name of the deployed stack
NAMESPACE_NAME=$(pulumi stack output namespaceName)
```

### deploy ingress for query-node

```
kubectl apply -f query-node/ingress.yaml --namespace $NAMESPACE_NAME
```

### deploy ingress for node-network

```
kubectl apply -f node-network/ingress.yaml --namespace $NAMESPACE_NAME
```

### 
In a separate terminal run the tunnel service, which will attempt to listen on port 80:

```
minikube tunnel
```

You could run it in the background with the "&" ampersand

```
minikube tunnel &
```

With ingress deployed you will be able to access the exposed services on:

```
ws://localhost/ws-rpc
http://localhost/indexer/graphql
http://localhost/server/graphql
```

kill the background job by its given number (assuming job number 1)

```
kill %1
```

### Destroying stack and cluster

```
pulumi destroy
minikube stop
minikube delete
```

# Kind

### Create a 'kind' cluster
Our cluster configuration will try to listen on port 80 so there cannot be another service running on that port.

```
# optionally save cluster config in specific location, remember to set this again when using kubectl command
# to access the cluster
export KUBECONFIG=$(PWD)/kubeconfig
# create the cluster
kind create cluster --config ./kind-cluster.yaml --name joystream
```

```
# confirm current context is set to newly created cluster
kubectl config current-context
# you should see:
kind-joystream

# if you have switched to a different context you can switch back to the cluster with:
kubectl config set current-context kind-joystream

# list cluster nodes
kubectl get nodes

# get cluster details
kubectl cluster-info
```

### Deploy nginx ingress controller

```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

### Wait for controller to be ready

```
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### Load the required docker images
Load docker images for the stacks. Do not use `:latest` tag otherwise it will be pulled from docker hub.

```
kind load docker-image joystream/node:giza 
kind load docker-image joystream/apps:giza
```

### Deploy a pulumi stack..
For more details see the README files for each stack.
```
pulumi up  ...
# get the namespace name for the stack that was deployed
NAMESPACE_NAME=$(pulumi stack output namespaceName)
```

### Deploy ingress (node network)
kubectl apply -f node-network/ingress.yaml --namespace $NAMESPACE_NAME

### Deploy ingress (query node)
kubectl apply -f query-node/ingress.yaml --namespace $NAMESPACE_NAME

With ingress deployed you will be able to access the exposed services on:

```
ws://localhost/ws-rpc
http://localhost/indexer/graphql
http://localhost/server/graphql
```

### Destroy the stack and cluster

```
pulumi destroy
kind delete cluster
```