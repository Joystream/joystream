import { ChannelCreationParametersMetadata, AssetsMetadata, NewAssetMetadata, Urls, ChannelMetadata, Upload } from '../src'
import { assert } from 'chai'

describe('Channel Creation Metadata', () => {
  it('Message', () => {
    const channelCreation = new ChannelCreationParametersMetadata()

    const rewardAccount = "0x0a11c9bcc81f8bd314e80bc51cbfacf30eaeb57e863196a79cccdc8bf4750d21"

    channelCreation.setAssets(new AssetsMetadata())
    channelCreation.setMeta(new ChannelMetadata())
    channelCreation.setRewardAccount(rewardAccount)

    assert.deepEqual(channelCreation.toObject(), {
      assets: {
        newAssetList: [],
      },
      meta: {
        avatarPhoto: undefined,
        category: undefined,
        coverPhoto: undefined,
        description: undefined,
        isPublic: undefined,
        language: undefined,
        title: undefined
      },
      rewardAccount: rewardAccount,
    })
  })
})

describe('Assets Creation Metadata', () => {
    it('Message', () => {
      const assetsCreation = new AssetsMetadata()
  
      const newAsset = new NewAssetMetadata()
      assetsCreation.addNewAsset(newAsset)
  
      assert.deepEqual(assetsCreation.toObject(), {
        newAssetList: [{
          upload: undefined,
          urls: undefined,
        }],
      })
    })
})

describe('Urls Creation Metadata', () => {
  it('Message', () => {

    const urls = new Urls()
    const url = "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png"
    urls.addUrls(url) 

    assert.deepEqual(urls.toObject(), {
      urlsList: [url]
    })
  })
})

describe('Upload Creation Metadata', () => {
  it('Message', () => {

    const upload = new Upload()
    upload.setContentId(1)
    upload.setIpfsContentId("0x01")
    upload.setSize(10000)
    upload.setTypeId(5)

    assert.deepEqual(upload.toObject(), {
      contentId: 1,
      typeId: 5,
      size: 10000,
      ipfsContentId: "0x01",
    })
  })
})
