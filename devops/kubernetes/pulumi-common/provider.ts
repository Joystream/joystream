import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

export function getProvider(clusterStackRef: pulumi.StackReference): k8s.Provider {
  let provider: k8s.Provider
  let kubeconfig: pulumi.Output<any>

  const platform = pulumi.interpolate`${clusterStackRef.requireOutput('platform')}`

  if (platform === pulumi.interpolate`aws`) {
    kubeconfig = clusterStackRef.requireOutput('kubeconfig')
    provider = new k8s.Provider('aws', { kubeconfig })
  } else {
    provider = new k8s.Provider('local', {})
  }
  return provider
}

export function isPlatformMinikube(clusterStackRef: pulumi.StackReference): pulumi.OutputInstance<boolean> {
  const isMinikube = clusterStackRef.requireOutput('platform').apply((platform) => {
    return platform === 'minikube' ? true : false
  })
  return isMinikube
}
