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
          name: 'subkey-data',
          mountPath: dataPath,
        },
      ],
    })
  }
  return result
}

export const getValidatorContainers = (
  validators: number,
  dataPath: string,
  builderPath: string,
  chainSpecPath: string
) => {
  const result = []
  for (let i = 1; i <= validators; i++) {
    result.push({
      name: `joystream-node-${i}`,
      image: 'joystream/node:latest',
      ports: [{ containerPort: 9944 }, { containerPort: 9933 }],
      args: [
        '--chain',
        chainSpecPath,
        '--pruning',
        'archive',
        '--node-key-file',
        `${dataPath}/privatekey${i}`,
        '--keystore-path',
        `${builderPath}/data/auth-${i - 1}`,
        '--validator',
        '--log',
        'runtime,txpool,transaction-pool,trace=sync',
      ],
      volumeMounts: [
        {
          name: 'subkey-data',
          mountPath: dataPath,
        },
        {
          name: 'builder-data',
          mountPath: builderPath,
        },
      ],
    })
  }
  return result
}
