import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@joystream/types/'

export async function run() { 
    const wsProvider = new WsProvider('ws://localhost:9944');
    let extendedTypes = types;
    extendedTypes.StorageBucketId = {}
    extendedTypes.BagId = {}
    extendedTypes.UploadParameters = {}
    extendedTypes.DynamicBagId = {}
    extendedTypes.StorageBucketsPerBagValueConstraint = {}
    extendedTypes.Voucher = {}
    extendedTypes.DynamicBagType = {}
    extendedTypes.DynamicBagCreationPolicy = {}
    extendedTypes.DataObjectId = {}
    extendedTypes.DynamicBag = {}
    extendedTypes.StaticBag = {}
    extendedTypes.StaticBag = {}
    extendedTypes.StaticBagId = {}
    extendedTypes.StorageBucket = {}

    try  {
      let api = await ApiPromise.create({provider: wsProvider, types: extendedTypes})
      console.log(api.genesisHash.toHex())
      const memberId = 0

      let profile = await api.query.members.membershipById(memberId)
      console.log(profile)
    }
    catch(err) {
     console.error(`Api Error: ${err}`)
    }
}