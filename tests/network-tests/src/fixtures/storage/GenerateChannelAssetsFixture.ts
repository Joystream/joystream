import assert from 'assert'
import { readFileSync } from 'fs'
import { ChannelCreationInputParameters } from '@joystream/cli/src/Types'
import { MemberId } from '@joystream/types/primitives'
import { BaseQueryNodeFixture, FixtureRunner } from '../../Fixture'
import { JoystreamCLI } from '../../cli/joystream'
import { QueryNodeApi } from '../../QueryNodeApi'
import { Api } from '../../Api'
import { BuyMembershipHappyCaseFixture } from '../membership'
import { Utils } from '../../utils'
import { ColossusApi } from '../../../ColossusApi'
import { ChannelFieldsFragment } from '../../graphql/generated/queries'

export type GenerateAssetsFixtureParams = {
  numberOfChannels: number
  avatarGenerator?: (i: number) => string
  coverGenerator?: (i: number) => string
}

export type CreatedChannelData = {
  id: number
  coverPhotoPath: string
  avatarPhotoPath: string
  qnData?: ChannelFieldsFragment
}

export type VerifyAssetsInput = {
  api: ColossusApi
  channelIds: number[]
}

export class GenerateAssetsFixture extends BaseQueryNodeFixture {
  private _channelsCreated: CreatedChannelData[] = []

  constructor(
    public api: Api,
    public query: QueryNodeApi,
    public cli: JoystreamCLI,
    private params: GenerateAssetsFixtureParams
  ) {
    super(api, query)
  }

  public get channelsCreated(): CreatedChannelData[] {
    assert(this._channelsCreated.length, 'Trying to retrieve channelsCreated before any results are available')
    return this._channelsCreated
  }

  private async setupChannelOwner() {
    const { api, query } = this
    // Create a member that will create the channels
    const [memberKeyPair] = await api.createKeyPairs(1)
    const memberAddr = memberKeyPair.key.address
    const buyMembershipFixture = new BuyMembershipHappyCaseFixture(api, query, [memberAddr])
    await new FixtureRunner(buyMembershipFixture).run()
    const [memberId] = buyMembershipFixture.getCreatedMembers()

    // Give member 10 JOY per channel, to be able to pay the fees
    await api.treasuryTransferBalance(memberAddr, Utils.joy(10))

    // Import the member controller key to CLI
    this.cli.importAccount(memberKeyPair.key)

    return memberId
  }

  /*
    Execute this Fixture.
  */
  public async execute(): Promise<void> {
    this.debug('Setting up channel owner')
    const memberId = await this.setupChannelOwner()

    this.debug('Creating channels')
    this._channelsCreated = await this.createChannels(memberId)
  }

  private defaultAvatarGenerator(i: number): string {
    return this.cli.getTmpFileManager().randomImgFile(300, 300)
  }

  private defaultCoverGenerator(i: number): string {
    return this.cli.getTmpFileManager().randomImgFile(1920, 500)
  }

  /**
    Generates the channels.
  */
  private async createChannels(memberId: MemberId): Promise<CreatedChannelData[]> {
    const { avatarGenerator: customAvatarGenerator, coverGenerator: customCoverGenerator } = this.params
    const avatarGenerator = customAvatarGenerator || this.defaultAvatarGenerator.bind(this)
    const coverGenerator = customCoverGenerator || this.defaultCoverGenerator.bind(this)
    const channelsData: CreatedChannelData[] = []
    for (let i = 0; i < this.params.numberOfChannels; ++i) {
      const avatarPhotoPath = avatarGenerator(i)
      const coverPhotoPath = coverGenerator(i)
      const channelInput: ChannelCreationInputParameters = {
        title: `GenerateAssetsFixture channel ${i + 1}`,
        avatarPhotoPath,
        coverPhotoPath,
      }
      const channelId = await this.cli.createChannel(channelInput, [
        '--context',
        'Member',
        '--useMemberId',
        memberId.toString(),
      ])
      this.debug(`Created channel ${i + 1} / ${this.params.numberOfChannels}`)
      channelsData.push({ id: channelId, avatarPhotoPath, coverPhotoPath })
    }
    return channelsData
  }

  public async runQueryNodeChecks(): Promise<void> {
    await super.runQueryNodeChecks()
    const { query, channelsCreated } = this
    await query.tryQueryWithTimeout(
      () => query.channelsByIds(channelsCreated.map(({ id }) => id.toString())),
      (r) => {
        this.channelsCreated.forEach((channelData) => {
          const qnData = r.find((c) => c.id === channelData.id.toString())
          Utils.assert(qnData, `Cannot find channel ${channelData.id} in the query node`)
          Utils.assert(qnData.avatarPhoto && qnData.coverPhoto, `Missing some assets in channel ${channelData.id}`)
          channelData.qnData = qnData
        })
      }
    )
  }

  public verifyAssets = async (inputs: VerifyAssetsInput[], retryTime = 10_000, maxRetries = 18): Promise<void> => {
    await Utils.until(
      `assets stored by Colossus nodes match expectations`,
      async () => {
        const verifyAssetsPromises = this.channelsCreated.map(
          async ({ id, avatarPhotoPath, coverPhotoPath, qnData }) => {
            Utils.assert(qnData && qnData.avatarPhoto && qnData.coverPhoto)
            for (const { api: colossusApi, channelIds: expectedChannelIds } of inputs) {
              if (expectedChannelIds.includes(id)) {
                await Promise.all([
                  colossusApi.fetchAndVerifyAsset(qnData.coverPhoto.id, readFileSync(coverPhotoPath), 'image/bmp'),
                  colossusApi.fetchAndVerifyAsset(qnData.avatarPhoto.id, readFileSync(avatarPhotoPath), 'image/bmp'),
                ])
              } else {
                await Promise.all([
                  colossusApi.expectAssetNotFound(qnData.coverPhoto.id),
                  colossusApi.expectAssetNotFound(qnData.avatarPhoto.id),
                ])
              }
            }
          }
        )
        await Promise.all(verifyAssetsPromises)
        return true
      },
      retryTime,
      maxRetries
    )
  }
}
