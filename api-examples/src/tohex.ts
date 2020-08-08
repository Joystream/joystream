import { ApiPromise, WsProvider } from '@polkadot/api';
import { CuratorApplicationId } from '@joystream/types/content-working-group';
import { BTreeSet } from '@polkadot/types';
import { types } from '@joystream/types'

async function main() {
    const provider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider, types })

    let wgId = [1, 2]

    let set = new BTreeSet<CuratorApplicationId>(api.registry, CuratorApplicationId, []);
    
    wgId.forEach((id) => {
        set.add(new CuratorApplicationId(api.registry, id))
    })
    
    /*
    Replace the integers inside the bracket in:
    let wgId:number[] = [1, 2];
    With the "WG ID"s of the curators you wish to hire, in ascending order.

    To hire "WG ID" 18 21 and 16:
    let wgId:number[] = [16, 18, 21];
    */

    console.log('copy/paste the output below to hire curator applicant(s) with WG IDs:', wgId )
    console.log(set.toHex())

    api.disconnect()
}

main()