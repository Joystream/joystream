const { RuntimeApi } = require('@joystream/storage-runtime-api')

const { discover, publish } = require('./')

async function main() {
  // The assigned storage-provider id
  const providerId = 0

  const runtimeApi = await RuntimeApi.create({
    // Path to the role account key file of the provider
    account_file: '/path/to/role_account_key_file.json',
    storageProviderId: providerId,
  })

  const ipnsId = await publish.publish(
    {
      asset: {
        version: 1,
        endpoint: 'http://endpoint.com',
      },
    },
    runtimeApi
  )

  console.log(ipnsId)

  // register ipnsId on chain
  await runtimeApi.setAccountInfo(ipnsId)

  const serviceInfo = await discover.discover(providerId, runtimeApi)

  console.log(serviceInfo)

  runtimeApi.api.disconnect()
}

main()
