import { KeyringPair } from '@polkadot/keyring/types'
import path from 'path'
import { CLI, CommandResult } from './base'
import { TmpFileManager } from './utils'
import {
  VideoInputParameters,
  ChannelCreationInputParameters,
  ChannelUpdateInputParameters,
} from '@joystream/cli/src/Types'
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

    const { out, stderr, exitCode } = await this.run('content:createChannel', ['--input', jsonFile, ...args])

    if (exitCode && !this.isErrorDueToNoStorage(exitCode)) {
      throw new Error(`Unexpected CLI failure on creating channel: "${stderr}"`)
    }

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
  async createVideoCategory(name: string): Promise<void> {
    const { stderr, exitCode } = await this.run('content:createVideoCategory', [name])

    if (exitCode) {
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }

  /**
    Updates an existing video.
  */
  async updateVideo(videoId: number, video: VideoInputParameters): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(video)

    const { stderr, exitCode } = await this.run('content:updateVideo', ['--input', jsonFile, videoId.toString()])

    if (exitCode && !this.isErrorDueToNoStorage(exitCode)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on updating video: "${stderr}"`)
    }
  }

  async deleteVideo(videoId: number): Promise<void> {
    const { stderr, exitCode } = await this.run('content:deleteVideo', ['-v', videoId.toString(), '-f'])

    if (exitCode) {
      throw new Error(`Unexpected CLI failure on deleting video: "${stderr}"`)
    }
  }

  /**
    Updates a channel.
  */
  async updateChannel(channelId: number, channel: ChannelUpdateInputParameters): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(channel)

    const { stderr, exitCode } = await this.run('content:updateChannel', ['--input', jsonFile, channelId.toString()])

    if (exitCode && !this.isErrorDueToNoStorage(exitCode)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }
}
