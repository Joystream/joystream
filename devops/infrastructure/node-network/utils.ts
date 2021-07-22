export const getSubkeyContainers = (validators: number, dataPath: string) => {
  const result = []
  for (let i = 1; i <= validators; i++) {
    result.push({
      name: `subkey-node-${i}`,
      image: 'parity/subkey:latest',
      command: ['/bin/sh', '-c'],
      args: [`subkey generate-node-key >> ${dataPath}/privatekey${i} 2>> ${dataPath}/publickey${i}`],
      volumeMounts: [
        {
          name: 'config-data',
          mountPath: dataPath,
        },
      ],
    })
  }
  return result
}

export const getValidatorContainers = (validators: number, dataPath: string, chainSpecPath: string) => {
  const result = []
  for (let i = 1; i <= validators; i++) {
    result.push({
      name: `joystream-node-${i}`,
      image: 'joystream/node:latest',
      args: [
        '--chain',
        chainSpecPath,
        '--pruning',
        'archive',
        '--node-key-file',
        `${dataPath}/privatekey${i}`,
        '--keystore-path',
        `${dataPath}/data/auth-${i - 1}`,
        '--validator',
        '--log',
        'runtime,txpool,transaction-pool,trace=sync',
      ],
      volumeMounts: [
        {
          name: 'config-data',
          mountPath: dataPath,
        },
      ],
    })
  }
  return result
}
