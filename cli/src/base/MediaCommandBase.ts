import ContentDirectoryCommandBase from './ContentDirectoryCommandBase'
import { VideoEntity, KnownLicenseEntity } from '@joystream/cd-schemas/types/entities'
import fs from 'fs'
import { DistinctQuestion } from 'inquirer'
import path from 'path'
import os from 'os'

const MAX_USER_LICENSE_CONTENT_LENGTH = 4096

/**
 * Abstract base class for higher-level media commands
 */
export default abstract class MediaCommandBase extends ContentDirectoryCommandBase {
  async promptForNewLicense(): Promise<VideoEntity['license']> {
    let license: VideoEntity['license']
    const licenseType: 'known' | 'custom' = await this.simplePrompt({
      type: 'list',
      message: 'Choose license type',
      choices: [
        { name: 'Creative Commons', value: 'known' },
        { name: 'Custom (user-defined)', value: 'custom' },
      ],
    })
    if (licenseType === 'known') {
      const [id, knownLicenseEntity] = await this.promptForEntityEntry('Choose License', 'KnownLicense', 'code')
      const knownLicense = await this.parseToKnownEntityJson<KnownLicenseEntity>(knownLicenseEntity)
      if (knownLicense.attributionRequired) {
        // Attribution required - convert to UserDefinedLicense
        const attribution = await this.simplePrompt({ message: 'Attribution' })
        const { name, code, description, url } = knownLicense
        const licenseContent =
          `${code}${name ? ` (${name})` : ''}\n\n` +
          (description ? `${description}\n\n` : '') +
          (url ? `${url}\n\n` : '') +
          `Attribution: ${attribution}`
        license = { new: { userDefinedLicense: { new: { content: licenseContent } } } }
      } else {
        license = { new: { knownLicense: id.toNumber() } }
      }
    } else {
      let licenseContent: null | string = null
      while (licenseContent === null) {
        try {
          let licensePath: string = await this.simplePrompt({ message: 'Path to license file:' })
          licensePath = path.resolve(process.cwd(), licensePath.replace(/^~/, os.homedir()))
          licenseContent = fs.readFileSync(licensePath).toString()
        } catch (e) {
          this.warn("The file was not found or couldn't be accessed, try again...")
        }
        if (licenseContent !== null && licenseContent.length > MAX_USER_LICENSE_CONTENT_LENGTH) {
          this.warn(`The license content cannot be more than ${MAX_USER_LICENSE_CONTENT_LENGTH} characters long`)
          licenseContent = null
        }
      }
      license = { new: { userDefinedLicense: { new: { content: licenseContent } } } }
    }

    return license
  }

  async promptForPublishedBeforeJoystream(current?: number | null): Promise<number | null> {
    const publishedBefore = await this.simplePrompt({
      type: 'confirm',
      message: `Do you want to set optional first publication date (publishedBeforeJoystream)?`,
      default: typeof current === 'number',
    })
    if (publishedBefore) {
      const options = ({
        type: 'datetime',
        message: 'Date of first publication',
        format: ['yyyy', '-', 'mm', '-', 'dd', ' ', 'hh', ':', 'MM', ' ', 'TT'],
        initial: current && new Date(current * 1000),
      } as unknown) as DistinctQuestion // Need to assert, because we use datetime plugin which has no TS support
      const date = await this.simplePrompt(options)
      return Math.floor(new Date(date).getTime() / 1000)
    }
    return null
  }
}
