import { CuratorApplicationId } from '@joystream/types/content-working-group'
import { BTreeSet, createType, TypeRegistry } from '@polkadot/types'
import { types } from '@joystream/types'

async function main() {
  const wgId = [1, 2]

  const registry = new TypeRegistry()
  registry.register(types)

  const set = new BTreeSet<CuratorApplicationId>(registry, CuratorApplicationId, [])

  wgId.forEach((id) => {
    set.add(createType(registry, 'CuratorApplicationId', id))
  })

  /*
    Replace the integers inside the bracket in:
    let wgId:number[] = [1, 2];
    With the "WG ID"s of the curators you wish to hire, in ascending order.

    To hire "WG ID" 18 21 and 16:
    let wgId:number[] = [16, 18, 21];
    */

  console.log('copy/paste the output below to hire curator applicant(s) with WG IDs:', wgId)
  console.log(set.toHex())
}

main()
