const { RuntimeApi } = require('@joystream/storage-runtime-api')

const { discover, publish } = require('./')

async function main() {
    // The assigned storage-provider id
    const provider_id = 0

    const runtimeApi = await RuntimeApi.create({
        // Path to the role account key file of the provider
        account_file: "/path/to/role_account_key_file.json",
        storageProviderId: provider_id
    })

    let ipns_id = await publish.publish(
        {
            asset: {
                version: 1,
                endpoint: 'http://endpoint.com'
            }
        },
        runtimeApi
    )

    console.log(ipns_id)

    // register ipns_id on chain
    await runtimeApi.setAccountInfo(ipfs_id)

    let serviceInfo = await discover.discover(
        provider_id,
        runtimeApi
    )

    console.log(serviceInfo)

    runtimeApi.api.disconnect()
}

main()
