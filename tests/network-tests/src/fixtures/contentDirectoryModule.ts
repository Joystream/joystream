import { QueryNodeApi } from '../Api'
import BN from 'bn.js'
import { assert } from 'chai'
import { Seat } from '@joystream/types/council'
import { v4 as uuid } from 'uuid'
import { Utils } from '../utils'
import { Fixture } from '../Fixture'
import { ChannelEntity } from 'cd-schemas/types/entities/ChannelEntity'
import { VideoEntity } from 'cd-schemas/types/entities/VideoEntity'
import { KeyringPair } from '@polkadot/keyring/types'

export class CreateChannelFixture implements Fixture {
  private api: QueryNodeApi
  public channelEntity: ChannelEntity
  private pair: KeyringPair

  public constructor(api: QueryNodeApi, channelEntity: ChannelEntity, pair: KeyringPair) {
    this.api = api
    this.pair = pair
    this.channelEntity = channelEntity
  }

  public async runner(expectFailure: boolean): Promise<void> {
    await this.api.createChannelEntity(this.channelEntity, this.pair)


    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class CreateVideoFixture implements Fixture {
  private api: QueryNodeApi
  private pair: KeyringPair
  private videoEntity: VideoEntity

  public constructor(api: QueryNodeApi, videoEntity: VideoEntity, pair: KeyringPair) {
    this.api = api
    this.videoEntity = videoEntity
    this.pair = pair
  }

  public async runner(expectFailure: boolean): Promise<void> {
    await this.api.createVideoEntity(this.videoEntity, this.pair)


    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}

export class UpdateChannelFixture implements Fixture {
  private api: QueryNodeApi
  private pair: KeyringPair
  private channelUpdateInput: Record<string, any>
  private uniquePropValue: Record<string, any>

  public constructor(api: QueryNodeApi, channelUpdateInput: Record<string, any>, uniquePropValue: Record<string, any>, pair: KeyringPair) {
    this.api = api
    this.channelUpdateInput = channelUpdateInput
    this.uniquePropValue = uniquePropValue
    this.pair = pair
  }

  public async runner(expectFailure: boolean): Promise<void> {
    await this.api.updateChannelEntity(this.channelUpdateInput, this.uniquePropValue, this.pair)


    if (expectFailure) {
      throw new Error('Successful fixture run while expecting failure')
    }
  }
}