import * as path from 'path'
import { spawnSync } from 'child_process'
import * as fs from 'fs'
import { KeyringPair } from '@polkadot/keyring/types'

export interface ICreatedVideoData {
  videoId: number
  assetContentIds: string[]
}

/**
  Adapter for calling CLI commands from integration tests.
*/
export class CliApi {
  private tmpFilePath: string // filepath for temporary file needed to transfer data from and to cli
  readonly cliExamplesFolderPath: string

  public constructor() {
    this.tmpFilePath = path.join(__dirname, '/__CliApi_tempfile.json')
    this.cliExamplesFolderPath = path.dirname(require.resolve('@joystream/cli/package.json')) + '/examples/content'
  }

  /**
    Runs CLI command with specified arguments.
  */
  private runCommand(
    parameters: string[],
    env: Record<string, string> = {}
  ): { error: boolean; stdout: string; stderr: string } {
    // use sync spawn if that works without issues
    const output = spawnSync('yarn', ['joystream-cli', ...parameters], { env })
    console.log('cli - output:', output)
    console.log('cli - stdout:', output.stdout.toString())
    console.log('cli - stderr:', output.stderr.toString())

    return {
      error: !!output.error,
      stdout: (output.stdout || '').toString(),
      stderr: (output.stderr || '').toString(),
    }
  }

  /**
    Saves data to temporary file that can be passed to CLI as data input.
  */
  private saveToTempFile(content: string) {
    try {
      fs.writeFileSync(this.tmpFilePath, content + '\n')
    } catch (e) {
      throw new Error(`Can't write to temporary file "${this.tmpFilePath}"`)
    }
  }

  /**
    Parses `id` of newly created content entity from CLI's stdout.
  */
  private parseCreatedIdFromStdout(stdout: string): number {
    return parseInt((stdout.match(/with id (\d+) successfully created/) as RegExpMatchArray)[1])
  }

  /**
    Checks if CLI's stderr contains warning about no storage provider available.
  */
  private containsNoStorageWarning(text: string): boolean {
    return !!text.match(/^\s*\S\s*Warning: No storage provider is currently available!/)
  }

  /**
    Imports an account from Polkadot's keyring keypair to CLI.
  */
  async importAccount(keyringPair: KeyringPair, password = ''): Promise<void> {
    const importableAccount = JSON.stringify(keyringPair.toJson(password))
    this.saveToTempFile(importableAccount)

    const { stderr } = this.runCommand(['account:import', this.tmpFilePath])

    if (stderr) {
      throw new Error(`Unexpected CLI failure on importing account: "${stderr}"`)
    }
  }

  /**
    Selects an account that will be used by CLI for further commands.
  */
  async chooseAccount(accountAddress: string) {
    const { stderr } = this.runCommand(['account:choose', '--address', accountAddress])

    if (stderr) {
      throw new Error(`Unexpected CLI failure on choosing account: "${stderr}"`)
    }
  }

  /**
    Creates a new channel.
  */
  async createChannel(channel: unknown): Promise<number> {
    this.saveToTempFile(JSON.stringify(channel))

    const { stdout, stderr } = this.runCommand(
      ['content:createChannel', '--input', this.tmpFilePath, '--context', 'Member'],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr && !this.containsNoStorageWarning(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating channel: "${stderr}"`)
    }

    return this.parseCreatedIdFromStdout(stdout)
  }

  /**
    Creates a new channel category.
  */
  async createChannelCategory(channelCategory: unknown): Promise<number> {
    this.saveToTempFile(JSON.stringify(channelCategory))

    const { stdout, stderr } = this.runCommand(
      ['content:createChannelCategory', '--input', this.tmpFilePath, '--context', 'Lead'],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr) {
      throw new Error(`Unexpected CLI failure on creating channel category: "${stderr}"`)
    }

    return this.parseCreatedIdFromStdout(stdout)
  }

  /**
    Creates a new video.
  */
  async createVideo(channelId: number, video: unknown): Promise<ICreatedVideoData> {
    this.saveToTempFile(JSON.stringify(video))

    const { stdout, stderr } = this.runCommand(
      ['content:createVideo', '--input', this.tmpFilePath, '--channelId', channelId.toString()],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr && !this.containsNoStorageWarning(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating channel category: "${stderr}"`)
    }

    const videoId = this.parseCreatedIdFromStdout(stdout)
    const assetContentIds = Array.from(stdout.matchAll(/ content_id: "(0x[a-z0-9]+)"/g)).map((item) => item[1])

    return {
      videoId,
      assetContentIds,
    }
  }

  /**
    Creates a new video category.
  */
  async createVideoCategory(videoCategory: unknown): Promise<number> {
    this.saveToTempFile(JSON.stringify(videoCategory))

    const { stdout, stderr } = this.runCommand(
      ['content:createVideoCategory', '--input', this.tmpFilePath, '--context', 'Lead'],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr) {
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }

    return this.parseCreatedIdFromStdout(stdout)
  }

  /**
    Updates an existing video.
  */
  async updateVideo(videoId: number, video: unknown): Promise<void> {
    this.saveToTempFile(JSON.stringify(video))

    const { stdout, stderr } = this.runCommand(
      ['content:updateVideo', '--input', this.tmpFilePath, videoId.toString()],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr && !this.containsNoStorageWarning(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }

  /**
    Updates a channel.
  */
  async updateChannel(channelId: number, channel: unknown): Promise<void> {
    this.saveToTempFile(JSON.stringify(channel))

    const { stdout, stderr } = this.runCommand(
      ['content:updateChannel', '--input', this.tmpFilePath, channelId.toString()],
      { AUTO_CONFIRM: 'true' }
    )

    if (stderr && !this.containsNoStorageWarning(stderr)) {
      // ignore warnings
      throw new Error(`Unexpected CLI failure on creating video category: "${stderr}"`)
    }
  }
}
