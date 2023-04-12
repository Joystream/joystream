import { KeyringPair } from '@polkadot/keyring/types'
import path from 'path'
import { CLI, CommandResult } from './base'
import { TmpFileManager } from './utils'
import {
  VideoInputParameters,
  ChannelCreationInputParameters,
  ChannelUpdateInputParameters,
  AppInputDetails,
} from '@joystream/cli/src/Types'
import { Assets } from '@joystream/cli/src/schemas/typings/Assets.schema'
import ExitCodes from '@joystream/cli/src/ExitCodes'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../cli')

// ICreatedContentData
export interface ICreatedVideoData {
  videoId: number
  assetContentIds: string[]
}

export class JoystreamCLI extends CLI {
  protected keys: string[] = []
  protected tmpFileManager: TmpFileManager

  constructor(tmpFileManager: TmpFileManager) {
    const defaultEnv = {
      HOME: tmpFileManager.tmpDataDir,
    }

    super(CLI_ROOT_PATH, defaultEnv)
    this.tmpFileManager = tmpFileManager
  }

  /**
    Inits all required connections, etc.
  */
  async init(): Promise<void> {
    await this.run('api:setUri', [process.env.NODE_URL || 'ws://127.0.0.1:9944'])
    await this.run('api:setQueryNodeEndpoint', [process.env.QUERY_NODE_URL || 'http://127.0.0.1:8081/graphql'])
  }

  /**
    Imports accounts key to CLI.
  */
  async importAccount(pair: KeyringPair): Promise<void> {
    const password = ''
    const jsonFile = this.tmpFileManager.jsonFile(pair.toJson())
    await this.run('account:import', [
      '--backupFilePath',
      jsonFile,
      '--name',
      `Account${this.keys.length}`,
      '--password',
      password,
    ])
    this.keys.push(pair.address)
  }

  /**
    Runs Joystream CLI command.
  */
  async run(
    command: string,
    customArgs: string[] = [],
    keyLocks?: string[],
    requireSuccess = true
  ): Promise<CommandResult> {
    return super.run(command, customArgs, keyLocks || this.keys, requireSuccess)
  }

  /**
    Getter for temporary-file manager.
  */
  public getTmpFileManager(): TmpFileManager {
    return this.tmpFileManager
  }

  /**
    Parses `id` of newly created content entity from CLI's stdout.
  */
  private parseCreatedIdFromOutput(text: string): number {
    return parseInt((text.match(/with id (\d+) successfully created/) as RegExpMatchArray)[1])
  }

  /*
    Decide if CLI error indicates that storage provider is not available.
  */
  private isErrorDueToNoStorage(exitCode: number): boolean {
    return exitCode === ExitCodes.ActionCurrentlyUnavailable
  }

  /**
    Creates a new channel.
  */
  async createChannel(channel: ChannelCreationInputParameters, args: string[]): Promise<number> {
    const jsonFile = this.tmpFileManager.jsonFile(channel)

    const { out } = await this.run('content:createChannel', ['--input', jsonFile, ...args])

    return parseInt(out)
  }

  /**
    Creates a new video.
  */
  async createVideo(
    channelId: number,
    video: VideoInputParameters,
    canOmitUpload = true,
    args: string[] = []
  ): Promise<ICreatedVideoData> {
    const jsonFile = this.tmpFileManager.jsonFile(video)

    const { stdout, stderr, exitCode } = await this.run(
      'content:createVideo',
      ['--input', jsonFile, '--channelId', channelId.toString(), ...args],
      undefined,
      !canOmitUpload
    )

    // prevent error from CLI that create
    if (canOmitUpload && exitCode && !this.isErrorDueToNoStorage(exitCode)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video: "${stderr}"`)
    }

    const videoId = this.parseCreatedIdFromOutput(stderr)
    const assetContentIds = Array.from(stdout.matchAll(/ objectId: '([a-z0-9]+)'/g)).map((item) => item[1])

    return {
      videoId,
      assetContentIds,
    }
  }

  /**
    Creates a new video category.
  */
  async createVideoCategory(name: string, asMember: string): Promise<void> {
    await this.run('content:createVideoCategory', [name, '--useMemberId', asMember])
  }

  /**
    Updates an existing video.
  */
  async updateVideo(videoId: number, video: VideoInputParameters): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(video)

    await this.run('content:updateVideo', ['--input', jsonFile, videoId.toString()])
  }

  async deleteVideo(videoId: number): Promise<void> {
    await this.run('content:deleteVideo', ['-v', videoId.toString(), '-f'])
  }

  /**
    Deletes a channel.
  */
  async deleteChannel(channelId: number): Promise<void> {
    const { stderr, exitCode } = await this.run('content:deleteChannel', ['-c', channelId.toString(), '-f'])

    if (exitCode) {
      throw new Error(`Unexpected CLI failure on deleting channel: "${stderr}"`)
    }
  }

  /**
    Updates a channel.
  */
  async updateChannel(channelId: number, channel: ChannelUpdateInputParameters): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(channel)

    await this.run('content:updateChannel', ['--input', jsonFile, channelId.toString()])
  }

  /**
    generate ChannelPayoutsPayload.
  */
  async generateChannelPayoutsPayload(inputPath: string, outPath: string): Promise<void> {
    await this.run('content:generateChannelPayoutsPayload', ['-i', inputPath, '-o', outPath])
  }

  /**
    upload/reupload assets.
  */
  async reuploadAssets(assetsInput: Assets): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(assetsInput)

    await this.run('content:reuploadAssets', ['-i', jsonFile])
  }

  /**
   Creates an app.
   */
  async createApp(memberId: string, app: AppInputDetails): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(app)

    await this.run('apps:createApp', ['-i', jsonFile, '-s', '--useMemberId', memberId])
  }

  /**
   Updates an app.
   */
  async updateApp(memberId: string, appId: string, app: Partial<AppInputDetails>): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(app)

    await this.run('apps:updateApp', ['--appId', appId, '-i', jsonFile, '-s', '--useMemberId', memberId])
  }
}
