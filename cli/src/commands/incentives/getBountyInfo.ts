
import IncentivesCommandBase from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class GetBountyInfo extends IncentivesCommandBase {
  static description = 'Gets stats'
  static args = [
    {
      name: 'startBlockInput',
      required: true
    },
    {
      name: 'endBlockInput',
      required: true,
    },
  ]

  static flags = {
    ...IncentivesCommandBase.flags,
  }

  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(GetBountyInfo).args

    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    //const startBlockHash = await this.getBlockHash(startBlock)
    //const endBlockHash = await this.getBlockHash(endBlock)
    const bountiesCreatedByHR = await this.getBountiesCreated(startBlock,endBlock)

    this.log(JSON.stringify(bountiesCreatedByHR, null, 4))

    const allBounties = await this.getAllBountyData(startBlock,endBlock)
    console.log(allBounties)
    
    const bountyEarners = await this.getBountyEarners(startBlock,endBlock)
    console.log(bountyEarners)
  }
}
