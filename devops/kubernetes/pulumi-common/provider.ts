import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

export function getProvider(): k8s.Provider {
  const config = new pulumi.Config()
  let provider: k8s.Provider
  let kubeconfig: pulumi.Output<any>
  const clusterStackRef = new pulumi.StackReference(config.require('clusterStackRef'))

  const platform = pulumi.interpolate`${clusterStackRef.requireOutput('platform')}`

  if (platform === pulumi.interpolate`aws`) {
    kubeconfig = clusterStackRef.requireOutput('kubeconfig')
    provider = new k8s.Provider('aws', { kubeconfig })
  } else {
    provider = new k8s.Provider('local', {})
  }
  return provider
}

export function isPlatformMinikube(): boolean {
  const config = new pulumi.Config()
  const clusterStackRef = new pulumi.StackReference(config.require('clusterStackRef'))

  const platform = pulumi.interpolate`${clusterStackRef.requireOutput('platform')}`
  return platform === pulumi.interpolate`minikube` ? false : true
}
