import { KnownLicenses, CUSTOM_LICENSE_CODE, getLicenseCodeByName, createKnownLicenseFromCode } from '../src/licenses'
import { VideoMetadata } from '../src/index'
import { assert } from 'chai'

describe('Known License Codes', () => {
  it('Should not have license code default value 0', () => {
    assert(!KnownLicenses.has(0))
  })

  it('Correct Nunber of Known Licenses', () => {
    assert.equal(KnownLicenses.size, 9)
  })

  it('Custom License defined', () => {
    assert(KnownLicenses.has(CUSTOM_LICENSE_CODE))
  })

  it('Pre-defined Joystream license codes', () => {
    assert(KnownLicenses.has(1001))
    assert(KnownLicenses.has(1002))
    assert(KnownLicenses.has(1003))
    assert(KnownLicenses.has(1004))
    assert(KnownLicenses.has(1005))
    assert(KnownLicenses.has(1006))
    assert(KnownLicenses.has(1007))
    assert(KnownLicenses.has(1008))
  })

  it('Can create known licence by name', () => {
    const licenseCode = getLicenseCodeByName('CC_BY') as number
    const license = createKnownLicenseFromCode(licenseCode as number, 'Attribution: Joystream')
    const videoMeta = new VideoMetadata()
    videoMeta.setLicense(license)
  })
})
