import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs'
import ipfsHash from 'ipfs-only-hash'
import { ContentId, DataObject } from '@joystream/types/media'
import BN from 'bn.js'
import { Option } from '@polkadot/types/codec'
import { BaseCommand } from './base'
import { discover } from '@joystream/service-discovery/discover'
import Debug from 'debug'
import chalk from 'chalk'
import { aliceKeyPair } from './dev'
const debug = Debug('joystream:storage-cli:upload')

// Defines maximum content length for the assets (files). Limits the upload.
const MAX_CONTENT_LENGTH = 500 * 1024 * 1024 // 500Mb

// Defines the necessary parameters for the AddContent runtime tx.
interface AddContentParams {
  accountId: string
  ipfsCid: string
  contentId: ContentId
  fileSize: BN
  dataObjectTypeId: number
  memberId: number
}

// Upload command class. Validates input parameters and uploads the asset to the storage node and runtime.
export class UploadCommand extends BaseCommand {
  private readonly api: any
  private readonly mediaSourceFilePath: string
  private readonly dataObjectTypeId: string
  private readonly keyFile: string
  private readonly passPhrase: string
  private readonly memberId: string

  constructor(
    api: any,
    mediaSourceFilePath: string,
    dataObjectTypeId: string,
    memberId: string,
    keyFile: string,
    passPhrase: string
  ) {
    super()

    this.api = api
    this.mediaSourceFilePath = mediaSourceFilePath
    this.dataObjectTypeId = dataObjectTypeId
    this.memberId = memberId
    this.keyFile = keyFile
    this.passPhrase = passPhrase
  }

  // Provides parameter validation. Overrides the abstract method from the base class.
  protected validateParameters(): boolean {
    return (
      this.mediaSourceFilePath &&
      this.mediaSourceFilePath !== '' &&
      this.dataObjectTypeId &&
      this.dataObjectTypeId !== '' &&
      this.memberId &&
      this.memberId !== ''
    )
  }

  // Reads the file from the filesystem and computes IPFS hash.
  private async computeIpfsHash(): Promise<string> {
    const file = fs.createReadStream(this.mediaSourceFilePath).on('error', (err) => {
      this.fail(`File read failed: ${err}`)
    })

    return await ipfsHash.of(file)
  }

  // Read the file size from the file system.
  private getFileSize(): number {
    const stats = fs.statSync(this.mediaSourceFilePath)
    return stats.size
  }

  // Creates parameters for the AddContent runtime tx.
  private async getAddContentParams(): Promise<AddContentParams> {
    const identity = await this.loadIdentity()
    const accountId = identity.address

    const dataObjectTypeId: number = parseInt(this.dataObjectTypeId)
    if (isNaN(dataObjectTypeId)) {
      this.fail(`Cannot parse dataObjectTypeId: ${this.dataObjectTypeId}`)
    }

    const memberId: number = parseInt(this.memberId)
    if (isNaN(dataObjectTypeId)) {
      this.fail(`Cannot parse memberIdString: ${this.memberId}`)
    }

    return {
      accountId,
      ipfsCid: await this.computeIpfsHash(),
      contentId: ContentId.generate(),
      fileSize: new BN(this.getFileSize()),
      dataObjectTypeId,
      memberId,
    }
  }

  // Creates the DataObject in the runtime.
  private async createContent(p: AddContentParams): Promise<DataObject> {
    try {
      const dataObject: Option<DataObject> = await this.api.assets.createDataObject(
        p.accountId,
        p.memberId,
        p.contentId,
        p.dataObjectTypeId,
        p.fileSize,
        p.ipfsCid
      )

      if (dataObject.isNone) {
        this.fail('Cannot create data object: got None object')
      }

      return dataObject.unwrap()
    } catch (err) {
      this.fail(`Cannot create data object: ${err}`)
    }
  }

  // Uploads file to given asset URL.
  private async uploadFile(assetUrl: string) {
    // Create file read stream and set error handler.
    const file = fs.createReadStream(this.mediaSourceFilePath).on('error', (err) => {
      this.fail(`File read failed: ${err}`)
    })

    // Upload file from the stream.
    try {
      const fileSize = this.getFileSize()
      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': '', // https://github.com/Joystream/storage-node-joystream/issues/16
          'Content-Length': fileSize.toString(),
        },
        maxContentLength: MAX_CONTENT_LENGTH,
      }
      await axios.put(assetUrl, file, config)

      console.log('File uploaded.')
    } catch (err) {
      this.fail(err.toString())
    }
  }

  // Requests the runtime and obtains the storage node endpoint URL.
  private async discoverStorageProviderEndpoint(storageProviderId: string): Promise<string> {
    try {
      const serviceInfo = await discover(storageProviderId, this.api)

      if (serviceInfo === null) {
        this.fail('Storage node discovery failed.')
      }
      debug(`Discovered service info object: ${serviceInfo}`)

      const dataWrapper = JSON.parse(serviceInfo)
      const assetWrapper = JSON.parse(dataWrapper.serialized)

      return assetWrapper.asset.endpoint
    } catch (err) {
      this.fail(`Could not get asset endpoint: ${err}`)
    }
  }

  // Loads and unlocks the runtime identity using the key file and pass phrase.
  private async loadIdentity(): Promise<any> {
    const noKeyFileProvided = !this.keyFile || this.keyFile === ''
    const useAlice = noKeyFileProvided && (await this.api.system.isDevelopmentChain())

    if (useAlice) {
      debug("Discovered 'development' chain.")
      return aliceKeyPair(this.api)
    }

    try {
      await fs.promises.access(this.keyFile)
    } catch (error) {
      this.fail(`Cannot read file "${this.keyFile}".`)
    }

    return this.api.identities.loadUnlock(this.keyFile, this.passPhrase)
  }

  // Shows command usage. Overrides the abstract method from the base class.
  protected showUsage() {
    console.log(
      chalk.yellow(`
        Usage:       storage-cli upload mediaSourceFilePath dataObjectTypeId memberId [keyFilePath] [passPhrase]
        Example:     storage-cli upload ./movie.mp4 1 1 ./keyFile.json secretPhrase
        Development: storage-cli upload ./movie.mp4 1 0
      `)
    )
  }

  // Command executor.
  async run() {
    // Checks for input parameters, shows usage if they are invalid.
    if (!this.assertParameters()) return

    const addContentParams = await this.getAddContentParams()
    debug(`AddContent Tx params: ${JSON.stringify(addContentParams)}`)
    debug(`Decoded CID: ${addContentParams.contentId.toString()}`)

    const dataObject = await this.createContent(addContentParams)
    debug(`Received data object: ${dataObject.toString()}`)

    const colossusEndpoint = await this.discoverStorageProviderEndpoint(dataObject.liaison.toString())
    debug(`Discovered storage node endpoint: ${colossusEndpoint}`)

    const assetUrl = this.createAndLogAssetUrl(colossusEndpoint, addContentParams.contentId)
    await this.uploadFile(assetUrl)
  }
}
