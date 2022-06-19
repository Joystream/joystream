import IncentivesCommandBase, { AllEras } from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class ValidatorStats extends IncentivesCommandBase {
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
  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(ValidatorStats).args
    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    const startBlockHash = await this.getBlockHash(startBlock)
    const endBlockHash = await this.getBlockHash(endBlock)
    console.log("startBlock,startBlockHash",startBlock,startBlockHash.toString())
    console.log("endBlock,endBlockHash",endBlock,endBlockHash.toString())
    
    const eras = await this.getEraRange(startBlockHash,endBlockHash)
    console.log("eras",eras[0],eras[1],eras)

    const totalSum:AllEras = {
      firstStart: eras[0],
      lastEra: eras[1],
      actualRewardSum: 0,
      calculatedRewardSum: 0,
      totalMemberRewards: 0,
      totalNonMemberRewards: 0,
      totalNominatorRewards: 0,
      eraResults: [],
      memberRewards: [],
      nonMemberRewards: [],
    }
    const uniqueStashAccounts: string[] = []
    const assoicatedControllers: string[] = []
    const assoicatedRewards: number[] = []
    const assoicatedSlashes: number[] = []
    for (let era = eras[0]; era<eras[1]; era++) {
      const rewards = await this.getEraResults(era,endBlockHash)
      totalSum.actualRewardSum += rewards.eraTotalReward
      totalSum.calculatedRewardSum += rewards.summedRewards
      totalSum.eraResults.push(rewards)
      totalSum.totalNominatorRewards += rewards.nominatorRewards
      for (let i = 0; i<rewards.validatorStashes.length; i++) {
        const indexOf = uniqueStashAccounts.indexOf(rewards.validatorStashes[i])
        if (indexOf == -1) {
          uniqueStashAccounts.push(rewards.validatorStashes[i])
          assoicatedControllers.push(rewards.validatorControllers[i])
          assoicatedRewards.push(rewards.projectedRewards[i])
          assoicatedSlashes.push(rewards.slashesIncurred[i])
        } else {
          assoicatedRewards[indexOf] += rewards.projectedRewards[i]
          assoicatedSlashes[indexOf] += rewards.slashesIncurred[i]
        }
      }
    }
    const allMembers = await this.getOriginalApi().query.members.membershipById.entries()
    const memberRoot:string[] = []
    const memberCtrl:string[] = []
    const memberId: number[] = []
    allMembers.forEach(([a,b]) => {
      memberId.push(a.args[0].toNumber())
      memberRoot.push(b.root_account.toString())
      memberCtrl.push(b.controller_account.toString())
    })
    for (let i=0; i<uniqueStashAccounts.length; i++) {
      const valStash = uniqueStashAccounts[i]
      const valCtrl = assoicatedControllers[i]
      const indeces = [memberRoot.indexOf(valStash),memberRoot.indexOf(valCtrl),memberRoot.indexOf(valStash),memberRoot.indexOf(valCtrl)]
      indeces.sort((a,b) => b-a)
      if (indeces[0] == -1) {
        totalSum.nonMemberRewards.push({
          stash: uniqueStashAccounts[i],
          controller: assoicatedControllers[i],
          rewardsEarned: assoicatedRewards[i]-assoicatedSlashes[i]
        })
        totalSum.totalNonMemberRewards += assoicatedRewards[i]
      }
      else {
        totalSum.memberRewards.push({
          stash: uniqueStashAccounts[i],
          controller: assoicatedControllers[i],
          rewardsEarned: assoicatedRewards[i],
          memberId: memberId[indeces[0]],
        })
        totalSum.totalMemberRewards += assoicatedRewards[i]
      }
    }
    console.log(`totalSum`,JSON.stringify(totalSum, null, 4))
  }
}

