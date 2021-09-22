import {
  KnownLicenses,
  CUSTOM_LICENSE_CODE,
  getLicenseCodeByName,
  createKnownLicenseFromCode,
  createCustomKnownLicense,
} from '../src/licenses'
import { License } from '../src/index'
import { assert } from 'chai'

describe('Known License Codes', () => {
  it('Excludes default value 0', () => {
    assert(!KnownLicenses.has(0))
  })

  it('Pre-defined Joystream license codes', () => {
    // Make sure we have correct known custom license
    assert(KnownLicenses.has(CUSTOM_LICENSE_CODE))
    assert.equal(KnownLicenses.get(CUSTOM_LICENSE_CODE)?.name, 'CUSTOM')

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
    const TEXT = 'custom text'
    const license = createCustomKnownLicense(TEXT)
    assert.equal(license.code, CUSTOM_LICENSE_CODE)
    assert.equal(license.customText, TEXT)
    License.verify(license)
  })

  it('createKnownLicenseFromCode(): License can be created by name', () => {
    const NAME = 'CC_BY'
    const ATTRIBUTION = 'Attribution: Joystream'
    const licenseCode = getLicenseCodeByName(NAME) as number
    const license = createKnownLicenseFromCode(licenseCode, ATTRIBUTION)
    assert.isDefined(license.code)
    assert.equal(license.attribution, ATTRIBUTION)
    License.verify(license)
  })
})
