import {
  KnownLicenses,
  CUSTOM_LICENSE_CODE,
  getLicenseCodeByName,
  createKnownLicenseFromCode,
  createCustomKnownLicense,
} from '../src/licenses'
import { VideoMetadata } from '../src/index'
import { assert } from 'chai'

describe('Known License Codes', () => {
  it('Excludes default value 0', () => {
    assert(!KnownLicenses.has(0))
  })

  it('Pre-defined Joystream license codes', () => {
    // Make sure we have correct known custom license
    assert(KnownLicenses.has(CUSTOM_LICENSE_CODE))
    assert.equal(KnownLicenses.get(CUSTOM_LICENSE_CODE)!.name, 'CUSTOM')

    assert(KnownLicenses.has(1001))
    assert(KnownLicenses.has(1002))
    assert(KnownLicenses.has(1003))
    assert(KnownLicenses.has(1004))
    assert(KnownLicenses.has(1005))
    assert(KnownLicenses.has(1006))
    assert(KnownLicenses.has(1007))
    assert(KnownLicenses.has(1008))
  })

  it('createCustomKnownLicense(): uses correct code', () => {
    const license = createCustomKnownLicense('custom text')
    assert.equal(license.getCode(), CUSTOM_LICENSE_CODE)
  })

  it('createKnownLicenseFromCode(): License can be created by name', () => {
    const licenseCode = getLicenseCodeByName('CC_BY') as number
    const license = createKnownLicenseFromCode(licenseCode as number, 'Attribution: Joystream')
    const videoMeta = new VideoMetadata()
    videoMeta.setLicense(license)
  })
})
