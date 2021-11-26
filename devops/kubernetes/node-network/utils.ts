export const getSubkeyContainers = (validators: number, dataPath: string) => {
  const result = []
  for (let i = 1; i <= validators; i++) {
    result.push({
      name: `subkey-node-${i}`,
      image: 'parity/subkey:latest',
      command: ['/bin/sh', '-c'],
      args: [`subkey generate-node-key > ${dataPath}/privatekey${i} 2> ${dataPath}/publickey${i}`],
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
