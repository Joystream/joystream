import { DerivedPropertiesManager } from '../classes'
import { IExecutor, IListener, IChangePair } from '../interfaces'
import { DatabaseManager } from '@joystream/hydra-common'
import { Channel, ChannelNftCollectors, CuratorGroup, Membership, OwnedNft } from 'query-node/dist/model'

export type IOwnedNftChange = 1 | -1

class OwnedNftUpdateListener implements IListener<OwnedNft, IOwnedNftChange> {
  getRelationDependencies(): string[] {
    return ['ownerMember']
  }

  hasValueChanged(oldValue: OwnedNft | undefined, newValue: OwnedNft): IChangePair<IOwnedNftChange> | undefined
  hasValueChanged(oldValue: OwnedNft, newValue: OwnedNft | undefined): IChangePair<IOwnedNftChange> | undefined
  hasValueChanged(oldValue: OwnedNft, newValue: OwnedNft): IChangePair<IOwnedNftChange> | undefined {
    // at least one video should always exists but due to TS type limitations
    // (can't define at least one-of-two parameters required) this safety condition needs to be here
    if (!oldValue && !newValue) {
      return undefined
    }

    // NFT is being created?
    if (!oldValue) {
      return {
        old: undefined,
        new: 1,
      }
    }

    // NFT is being deleted?
    if (!newValue) {
      return {
        old: -1,
        new: undefined,
      }
    }

    // owner is unchanged?
    if (oldValue.ownerMember?.id.toString() === newValue.ownerMember?.id.toString()) {
      return undefined
    }

    // owner changed
    return {
      old: -1,
      new: 1,
    }
  }
}

interface IOwnerType {
  member: Membership | undefined
  curatorGroup: CuratorGroup | undefined
}

class NftCollectorsExecutor implements IExecutor<OwnedNft, IOwnedNftChange, ChannelNftCollectors> {
  async loadDerivedEntities(store: DatabaseManager, ownedNft: OwnedNft): Promise<ChannelNftCollectors[]> {
    // TODO: find way to reliably decide if channel, etc. are loaded and throw error if not

    const ownerType = {
      member: ownedNft.ownerMember,
      curatorGroup: ownedNft.ownerCuratorGroup,
    }
    const collectorsRecord = await this.ensureCollectorsRecord(store, ownerType, ownedNft.creatorChannel)

    return [collectorsRecord]
  }

  async saveDerivedEntities(store: DatabaseManager, [channelNftCollectors]: ChannelNftCollectors[]): Promise<void> {
    // don't save new record if no nft are owned
    if (channelNftCollectors.amount <= 0 && !channelNftCollectors.id) {
      return
    }

    // clean record if no nft are owned any longer
    if (channelNftCollectors.amount <= 0) {
      await store.remove(channelNftCollectors)
      return
    }

    // save record
    await store.save(channelNftCollectors)
  }

  updateOldValue(collectorsInfo: ChannelNftCollectors, change: IOwnedNftChange): ChannelNftCollectors {
    return this.updateValueCommon(collectorsInfo, change)
  }

  updateNewValue(collectorsInfo: ChannelNftCollectors, change: IOwnedNftChange): ChannelNftCollectors {
    return this.updateValueCommon(collectorsInfo, change)
  }

  private async ensureCollectorsRecord(
    store: DatabaseManager,
    ownerType: IOwnerType,
    channel: Channel
  ): Promise<ChannelNftCollectors> {
    const existingRecord = await store.get(ChannelNftCollectors, {
      where: {
        channel: { id: channel.id.toString() },
        ...(ownerType.member ? { memberId: ownerType.member?.id.toString() } : {}),
        ...(ownerType.curatorGroup ? { curatorGroupId: ownerType.curatorGroup?.id.toString() } : {}),
      },
    })

    if (existingRecord) {
      return existingRecord
    }

    const newRecord = new ChannelNftCollectors({
      channel,
      member: ownerType.member,
      curatorGroup: ownerType.curatorGroup,
      amount: 0,
      lastIncreaseAt: new Date(),
    })

    return newRecord
  }

  private updateValueCommon(channelNftCollectors: ChannelNftCollectors, change: IOwnedNftChange): ChannelNftCollectors {
    if (change > 0) {
      channelNftCollectors.lastIncreaseAt = new Date()
    }

    channelNftCollectors.amount += change

    return channelNftCollectors
  }
}

export function createVideoNftManager(store: DatabaseManager): DerivedPropertiesManager<OwnedNft, IOwnedNftChange> {
  const ownedNftListener = new OwnedNftUpdateListener()

  const manager = new DerivedPropertiesManager<OwnedNft, IOwnedNftChange>(store, OwnedNft, [
    'ownerCuratorGroup',
    'creatorChannel',
  ])

  // listen to change of nft's owner
  const ownedNftExecutors = [new NftCollectorsExecutor()]
  manager.registerListener(ownedNftListener, ownedNftExecutors)

  return manager
}
