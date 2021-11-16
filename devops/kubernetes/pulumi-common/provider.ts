import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

export async function getProvider(clusterStackRef: pulumi.StackReference): Promise<k8s.Provider> {
  const kubeconfig = await clusterStackRef.getOutputValue('kubeconfig')
  const platform = await clusterStackRef.getOutputValue('platform')

  // Create the k8s provider with the kubeconfig.
  return new k8s.Provider(platform, { kubeconfig })
}

export async function isPlatformMinikube(clusterStackRef: pulumi.StackReference): Promise<boolean> {
  const platform = await clusterStackRef.getOutputValue('platform')
  return platform === 'minikube' ? true : false
}
