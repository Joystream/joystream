import { EventContext, StoreContext } from '@joystream/hydra-common'
import { BountyMetadata } from '@joystream/metadata-protobuf'
import { AssuranceContractType, BountyActor, BountyId, FundingType } from '@joystream/types/augment'
import {
  Bounty,
  BountyContractClosed,
  BountyContractOpen,
  BountyCreatedEvent,
  BountyFundingLimited,
  BountyFundingPerpetual,
  BountyStage,
  ForumThread,
  Membership,
} from 'query-node/dist/model'
import { Bounty as BountyEvents } from '../generated/types'
import { deserializeMetadata, genericEventFields } from './common'

/**
 * Commons helpers
 */

function bountyActorToMembership(actor: BountyActor): Membership | undefined {
  if (actor.isMember) {
    return new Membership({ id: String(actor.asMember) })
  }
}

/**
 * Event handlers
 */

export async function bounty_BountyCreated({ event, store }: EventContext & StoreContext): Promise<void> {
  const createdEvent = new BountyEvents.BountyCreatedEvent(event)
  const [bountyId, bountyParams, metadataBytes] = createdEvent.params
  const eventTime = new Date(event.blockTimestamp)

  const metadata = deserializeMetadata(BountyMetadata, metadataBytes)

  const bounty = new Bounty({
    id: String(bountyId),
    createdAt: eventTime,
    updatedAt: eventTime,
    title: metadata?.title ?? undefined,
    description: metadata?.description ?? undefined,
    bannerImageUri: metadata?.bannerImageUri ?? undefined,
    cherry: bountyParams.cherry,
    entrantStake: bountyParams.entrant_stake,
    creator: bountyActorToMembership(bountyParams.creator),
    oracle: bountyActorToMembership(bountyParams.oracle),
    fundingType: asFundingType(bountyParams.funding_type),
    contractType: asContractType(bountyParams.contract_type),
    workPeriod: bountyParams.work_period.toNumber(),
    judgingPeriod: bountyParams.judging_period.toNumber(),

    stage: BountyStage.Funding,
    totalFunding: bountyParams.cherry,
    discussionThread: asForumThread(metadata?.discussionThread ?? undefined),
  })

  await store.save<Bounty>(bounty)

  const createdInEvent = new BountyCreatedEvent({ ...genericEventFields(event), bounty })
  await store.save<BountyCreatedEvent>(createdInEvent)

  function asFundingType(funding: FundingType) {
    if (funding.isPerpetual) {
      const perpetualFunding = new BountyFundingPerpetual()
      perpetualFunding.target = funding.asPerpetual.target
      return perpetualFunding
    } else {
      const limitedFunding = new BountyFundingLimited()
      limitedFunding.maxFundingAmount = funding.asLimited.max_funding_amount
      limitedFunding.minFundingAmount = funding.asLimited.min_funding_amount
      limitedFunding.fundingPeriod = funding.asLimited.funding_period.toNumber()
      return limitedFunding
    }
  }

  function asContractType(assuranceContract: AssuranceContractType) {
    if (assuranceContract.isOpen) {
      return new BountyContractOpen()
    } else {
      const closedContract = new BountyContractClosed()
      closedContract.whitelist = assuranceContract.asClosed.map((id) => new Membership({ id: String(id) }))
      return closedContract
    }
  }

  function asForumThread(threadId: number | undefined) {
    if (typeof threadId === 'number') {
      return new ForumThread({ id: String(threadId) })
    }
  }
}
