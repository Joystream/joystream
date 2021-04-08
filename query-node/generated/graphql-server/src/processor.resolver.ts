import { Resolver, ObjectType, Field, Subscription, Root } from 'type-graphql'
import { TOPICS } from './pubsub'

@ObjectType()
export class ProcessorState {
  @Field()
  lastCompleteBlock!: number

  @Field()
  lastProcessedEvent!: string

  @Field()
  indexerHead!: number

  @Field()
  chainHead!: number
}

@Resolver()
export class ProcessorStateResolver {
  @Subscription({ topics: TOPICS.processorState })
  stateSubscription(
    @Root()
    state: {
      lastScannedBlock?: number
      lastProcessedEvent?: string
      indexerHead?: number
      chainHead?: number
    }
  ): ProcessorState {
    return {
      lastCompleteBlock: state.lastScannedBlock || -1,
      lastProcessedEvent: state.lastProcessedEvent || 'NO_EVENTS',
      indexerHead: state.indexerHead || -1,
      chainHead: state.chainHead || -1,
    }
  }
}
