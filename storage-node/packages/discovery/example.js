const { RuntimeApi } = require('@joystream/runtime-api')

const { discover, publish } = require('./')

async function main() {
    const runtimeApi = await RuntimeApi.create({
        account_file: "/Users/mokhtar/Downloads/5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32.json"
    })

    let published = await publish.publish(
        "5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32",
        {
            asset: {
                version: 1,
                endpoint: 'http://endpoint.com'
            }
        },
        runtimeApi
    )

    console.log(published)

    // let serviceInfo = await discover('5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32', { runtimeApi })
    let serviceInfo = await discover.discover(
        '5Gn9n7SDJ7VgHqHQWYzkSA4vX6DCmS5TFWdHxikTXp9b4L32',
        runtimeApi
    )

    console.log(serviceInfo)

    runtimeApi.api.disconnect()
}

main()
