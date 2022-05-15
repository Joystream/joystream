
import { flags } from '@oclif/command'
import IncentivesCommandBase, { AllEras, BudgetStatus, EarnersByContext } from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class CouncilSpending extends IncentivesCommandBase {
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
    printBudgetSize: flags.boolean({
      description: 'If included, the budgets of all WGs and the council will be printed for the startblock and endblock.',
      required: false,
    }),
    getValidators: flags.string({
      description: 'If included, it also calculates the validator earnings. If followed by "full", it will include all the data generated.',
      required: false,
    }),
    ...IncentivesCommandBase.flags,
  }

  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(CouncilSpending).args
    const {
      flags: { printBudgetSize },
    } = this.parse(CouncilSpending)

    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    const startBlockHash = await this.getBlockHash(startBlock)
    const endBlockHash = await this.getBlockHash(endBlock)
    //const allWorkingGroups = AvailableGroups

    const earners: EarnersByContext[] = []

    const spend:BudgetStatus = {
      startAmount:0,
      endAmount: 0,
      refill: 0,
      spent: 0,
      groups: [],
      apiModuleGroupNames: [],
      groupStart: [],
      groupEnd: [],
      groupRefills: [],
      groupSpent: [],
      workersRewards: [],
      allWorkers: [],
      workersHiredDuringTerm: [],
      workersLeftDuringTerm: []
    }
  
    //Get the budget for all WGs and the Council at the start and at the end:
    await this.getAllBudgetStatusInRange(spend,startBlockHash,endBlockHash)


    //Get the all the budget increment for the Council in range:
    const budgetRefillEventsBetweenBlocks = await this.getQNApi().budgetRefillEventsBetweenBlocks(startBlock,endBlock)    
    for (let refills of budgetRefillEventsBetweenBlocks) {
      const groupIndex = spend.groups.indexOf("council")
      spend.groupRefills[groupIndex].push(parseInt(refills.balance))
      spend.refill += parseInt(refills.balance)
    }

    const getBudgetEventsInRange = await this.getQNApi().budgetUpdatedEventsBetweenBlocks(startBlock,endBlock)
    for (let update of getBudgetEventsInRange) {
      const indexOfGroup = spend.apiModuleGroupNames.indexOf(update.groupId)
      spend.groupRefills[indexOfGroup].push(parseInt(update.budgetChangeAmount))
    }
  
    //Get all the workers in all WGs, then all the rewards they earned
    await this.getWorkersInGroup(spend, startBlock,endBlock)
    const rewardPaidEventsBetweenBlocks = await this.getQNApi().rewardPaidEventsBetweenBlocks(startBlock,endBlock)
    for (let rewardPaid of rewardPaidEventsBetweenBlocks) {
      const indexOfGroup = spend.apiModuleGroupNames.indexOf(rewardPaid.groupId)
      spend.groupSpent[indexOfGroup].push(parseInt(rewardPaid.amount))
      const workerString = rewardPaid.worker.id.split("-")
      const workerIdInGroup = parseInt(workerString[1])
      const indexOfWorkerInGroup = spend.allWorkers[indexOfGroup].indexOf(workerIdInGroup)
      spend.workersRewards[indexOfGroup][indexOfWorkerInGroup].reward += parseInt(rewardPaid.amount)
    }

    //Get the rewards earned for all CMs over the period
    //Including any unpaid rewards to CM, as it's "random" who gets paid if the budget runs out
    const councilMembersAtBlock = await this.getQNApi().councilMembersAtBlock(endBlock)
    for (let councilorRewards of councilMembersAtBlock) {
      const indexOfGroup = spend.groups.indexOf("council")
      spend.groupSpent[indexOfGroup].push(parseInt(councilorRewards.accumulatedReward))
      spend.workersRewards[indexOfGroup].push({
        memberHandle: councilorRewards.member.handle,
        memberId: parseInt(councilorRewards.member.id),
        workerId: 0,
        rewardAccount: councilorRewards.rewardAccountId,
        hiredAt: startBlock,
        leftAt: endBlock,
        activeBlocks: endBlock-startBlock,
        isLead: "na",
        isActive: "na",
        reward: parseInt(councilorRewards.accumulatedReward)+parseInt(councilorRewards.unpaidReward)
      })
    }

    //Tally up total reward spending by group, and totals      
    for (let i=0; i<spend.groups.length; i++) {
      spend.startAmount += spend.groupStart[i]
      spend.endAmount += spend.groupEnd[i]
      let groupRewardSpending = 0
      if (printBudgetSize) {
        this.log(`The ${spend.groups[i]} budget had ${spend.groupStart[i]} at the start, and ${spend.groupEnd[i]} at the end.`)
      }
      for (let n=0; n<spend.groupSpent[i].length; n++) {
        spend.spent += spend.groupSpent[i][n]
        groupRewardSpending += spend.groupSpent[i][n]
      }
      this.log(`The ${spend.groups[i]} group spent a total of ${groupRewardSpending} on rewards over the period.`)  
    }
    const budgetDiff = spend.startAmount+spend.refill-spend.endAmount
    this.log(`
    The Council + WG budgets at the start of the period was: ${spend.startAmount} 
    The Council + WG budgets at the start of the period was: ${spend.endAmount} 
    The Council budget was replinished by a total of: ${spend.refill}
    This means a total of ${budgetDiff} was drained from the Council budget over the period.

    A total of ${spend.spent} was spend on rewards, meaning ${budgetDiff-spend.spent} was spent on other things.
    `)
    //Not clear if any events where the council budget was updated through sudo "counts"

    const membersInvited = await this.getQNApi().memberInvitedEventsBetweenBlocks(startBlock,endBlock)
    //Todo, check the price paid for each event
    //Todo, check if the mint is drained regardless of who the inviting member is
    const membershipPrice = (await this.getOriginalApi().query.members.membershipPrice.at(endBlockHash)).toNumber()
    let inviteMembershipSpending = 0
    membersInvited.forEach(() => {
      spend.groupSpent[spend.groups.indexOf("membership")].push(membershipPrice)
      inviteMembershipSpending += membershipPrice
    })
    this.log(`A total of ${inviteMembershipSpending} was spent on inviting new members`)
    

    const proposalEarners = await this.getFundingRequestsExecuted(startBlock,endBlock)
    
    this.log(`A total of ${proposalEarners.earnings} was spent on funding requests, where:
    - ${proposalEarners.eligibleEarner.length} members received tJOY eligible for JOY
    - ${proposalEarners.uneligibleEarner.length} members received tJOY uneligible for JOY`)

    earners.push(proposalEarners)

    const bountyEarners = await this.getBountyEarners(startBlock,endBlock)

    this.log(`A total of ${bountyEarners.earnings} was paid through for bounties made by the HR group:
    - ${bountyEarners.eligibleEarner.length} members received tJOY eligible for JOY
    - ${bountyEarners.uneligibleEarner.length} members received tJOY uneligible for JOY`)

    earners.push(bountyEarners)



    let allGroupSpending = 0
    for (let i=0; i<spend.workersRewards.length; i++) {
      let totalGroupSpending = 0
      for (let n=0; n<spend.groupSpent[i].length; n++) {
        totalGroupSpending+=spend.groupSpent[i][n]
      }
      allGroupSpending += totalGroupSpending
      console.log(`|Group|Member Handle|Member Id|Worker Id|Reward Account | isActive | isLead | tJOY Earned |`)
      for (let n=0; n<spend.workersRewards[i].length; n++) {
        const worker = spend.workersRewards[i][n]
        console.log(`|${spend.groups[i]}|${worker.memberHandle}|${worker.memberId}|${worker.workerId}|${worker.rewardAccount}|${worker.isActive}|${worker.isLead}|${worker.reward} |`)
      }
      console.log(`|${spend.groups[i]}|${spend.workersRewards[i].length}|NA|NA|NA|NA|NA|${totalGroupSpending} |`)
      console.log(``)
    }
    console.log("allGroupSpending",allGroupSpending)

    const eras = await this.getEraRange(startBlockHash,endBlockHash)

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
    const validatorEarners: EarnersByContext = {
      context: "validators",
      earnings: 0,
      eligibleEarnings: 0,
      uneligibleEarnings: 0,
      eligibleEarner: [],
      uneligibleEarner: [],
    }
    const allMembers = await this.getOriginalApi().query.members.membershipById.entriesAt(endBlockHash)
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
        validatorEarners.uneligibleEarner.push({
          account: valStash,
          earnings: assoicatedRewards[i]-assoicatedSlashes[i],
          notes: `No member account linked.`
        })
        totalSum.nonMemberRewards.push({
          stash: uniqueStashAccounts[i],
          controller: assoicatedControllers[i],
          rewardsEarned: assoicatedRewards[i]-assoicatedSlashes[i]
        })
        totalSum.totalNonMemberRewards += assoicatedRewards[i]
      }
      else {
        validatorEarners.eligibleEarner.push({
          memberId: memberId[indeces[0]],
          memberHandle: "na",
          account: valStash,
          earnings: assoicatedRewards[i]-assoicatedSlashes[i],
          notes: `Controller: ${valCtrl}`
        })
        totalSum.memberRewards.push({
          stash: uniqueStashAccounts[i],
          controller: assoicatedControllers[i],
          rewardsEarned: assoicatedRewards[i],
          memberId: memberId[indeces[0]],
        })
        totalSum.totalMemberRewards += assoicatedRewards[i]
      }
    }
    validatorEarners.earnings = totalSum.calculatedRewardSum
    validatorEarners.eligibleEarnings = totalSum.totalMemberRewards
    validatorEarners.uneligibleEarnings = totalSum.totalMemberRewards

    this.log(`A total of ${validatorEarners.earnings} was paid to validators and nominators, where:
    - ${validatorEarners.eligibleEarner.length} validators earned ${validatorEarners.earnings} tJOY eligible for JOY
    - ${bountyEarners.uneligibleEarner.length} validators earned ${validatorEarners.uneligibleEarnings} tJOY NOT eligible for JOY`)
    earners.push(validatorEarners)

    let allNonWgEarnings = 0
    let allNonWgEligebleEarnings = 0
    for (let i=0; i<earners.length; i++) {
      allNonWgEarnings += earners[i].earnings
      allNonWgEligebleEarnings += earners[i].eligibleEarnings
      console.log(`|Context|Member Handle|Member Id|Notes|Reward Account|tJOY Earned |`)
      for (let n=0; n<earners[i].eligibleEarner.length; n++) {
        const earner = earners[i].eligibleEarner[n]
        console.log(`|${earners[i].context}|${earner.memberHandle}|${earner.memberId}|${earner.notes}|${earner.account}|${earner.earnings} |`)
      }
      console.log(`|${earners[i].context}|${earners[i].eligibleEarner.length}|NA|NA|${allNonWgEligebleEarnings} |`)
      console.log(``)
    }
    console.log("allNonWgEarnings",allNonWgEarnings)
    console.log("allNonWgEligebleEarnings",allNonWgEligebleEarnings)
  }
}
