import { KeyringPair } from '@polkadot/keyring/types'
import path from 'path'
import { CLI, CommandResult } from './base'
import { TmpFileManager } from './utils'
import { MemberId } from '@joystream/types/common'

const CLI_ROOT_PATH = path.resolve(__dirname, '../../../../cli')

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

  /**
    Checks if CLI's stderr contains warning about no storage provider available.
  */
  private containsWarningNoStorage(stderr: string): boolean {
    return !!stderr.match(/^\s*\S\s*Warning: No storage provider is currently available!/m)
  }

  /**
    Checks if CLI's stderr contains warning about no password used when importing account.
  */
  private containsWarningEmptyPassword(text: string): boolean {
    return !!text.match(/^\s*\S\s*Warning: Using empty password is not recommended!/)
  }

  /**
    Selects active member for CLI commands.
  */
  async chooseMemberAccount(memberId: MemberId) {
    const { stderr } = await this.run('account:chooseMember', ['--memberId', memberId.toString()])

    if (stderr && !stderr.match(/^\s*Member switched to id/)) {
      throw new Error(`Unexpected CLI failure on choosing account: "${stderr}"`)
    }
  }

  /**
    Creates a new channel.
  */
  async createChannel(channel: unknown): Promise<number> {
    const jsonFile = this.tmpFileManager.jsonFile(channel)

    const { stdout, stderr, exitCode } = await this.run('content:createChannel', [
      '--input',
      jsonFile,
      '--context',
      'Member',
    ])

    if (exitCode && !this.containsWarningNoStorage(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating channel: "${stderr}"`)
    }

    return this.parseCreatedIdFromOutput(stderr)
  }

  /**
    Creates a new channel category.
  */
  async createChannelCategory(channelCategory: unknown): Promise<number> {
    const jsonFile = this.tmpFileManager.jsonFile(channelCategory)

    const { stdout, stderr, exitCode } = await this.run('content:createChannelCategory', [
      '--input',
      jsonFile,
      '--context',
      'Lead',
    ])

    if (exitCode) {
      throw new Error(`Unexpected CLI failure on creating channel category: "${stderr}"`)
    }

    return this.parseCreatedIdFromOutput(stderr)
  }

  /**
    Creates a new video.
  */
  async createVideo(channelId: number, video: unknown, canOmitUpload = true): Promise<ICreatedVideoData> {
    const jsonFile = this.tmpFileManager.jsonFile(video)

    const { stdout, stderr, exitCode } = await this.run(
      'content:createVideo',
      ['--input', jsonFile, '--channelId', channelId.toString()],
      undefined,
      !canOmitUpload
    )

    // prevent error from CLI that create
    if (canOmitUpload && exitCode && !this.containsWarningNoStorage(stderr)) {
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
  async createVideoCategory(videoCategory: unknown): Promise<number> {
    const jsonFile = this.tmpFileManager.jsonFile(videoCategory)

    const { stdout, stderr, exitCode } = await this.run('content:createVideoCategory', [
      '--input',
      jsonFile,
      '--context',
      'Lead',
    ])

    if (exitCode) {
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }

    return this.parseCreatedIdFromOutput(stderr)
  }

  /**
    Updates an existing video.
  */
  async updateVideo(videoId: number, video: unknown): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(video)

    const { stdout, stderr, exitCode } = await this.run('content:updateVideo', [
      '--input',
      jsonFile,
      videoId.toString(),
    ])

    if (exitCode && !this.containsWarningNoStorage(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }

  /**
    Updates a channel.
  */
  async updateChannel(channelId: number, channel: unknown): Promise<void> {
    const jsonFile = this.tmpFileManager.jsonFile(channel)

    const { stdout, stderr, exitCode } = await this.run('content:updateChannel', [
      '--input',
      jsonFile,
      channelId.toString(),
    ])

    if (exitCode && !this.containsWarningNoStorage(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }
}
