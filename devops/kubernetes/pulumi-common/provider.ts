import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'
import { readFileSync } from 'fs'

export async function getProvider(config: pulumi.Config): Promise<ProviderType> {
  const kubeconfigFile = config.get('kubeconfigFile')
  const clusterStackRefInput = config.get('clusterStackRef')

  let provider: k8s.Provider = new k8s.Provider('local', {})
  let isLocalProvider: boolean = false

  if (!kubeconfigFile && !clusterStackRefInput) {
    throw new Error('Need to provide either a kubeconfig file or a stack reference')
  }

  if (kubeconfigFile) {
    const kubeconfigData = readFileSync(kubeconfigFile).toString()
    const yamlFormatter = require('js-yaml')
    const kubeconfig = yamlFormatter.load(kubeconfigData)
    const context = kubeconfig['current-context']

    if (context.includes('aws')) {
      isLocalProvider = false
      provider = new k8s.Provider(context, { kubeconfig })
    } else {
      isLocalProvider = true
      provider = new k8s.Provider('local-provider', { kubeconfig })
    }
  } else if (clusterStackRefInput) {
    // Get's the Cluster provider and platform based on clusterStackRef platform config
    const clusterStackRef = new pulumi.StackReference(clusterStackRefInput)
    const kubeconfig = await clusterStackRef.getOutputValue('kubeconfig')
    const platform = await clusterStackRef.getOutputValue('platform')
    isLocalProvider = false
    provider = new k8s.Provider(platform, { kubeconfig })
  }
  return {
    provider,
    isLocalProvider: isLocalProvider,
  }
}

interface ProviderType {
  provider: k8s.Provider
  isLocalProvider: boolean
}
