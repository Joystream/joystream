import LICENSES from './KnownLicenses.json'
import { License } from '../proto/Video_pb'

export type LicenseCode = number

type KnownLicense = {
  code: LicenseCode
  name: string
  longName: string
  description: string
  url: string
  attributionRequired: boolean
}

export const KnownLicenses = new Map<LicenseCode, KnownLicense>()

LICENSES.forEach((license: KnownLicense) => {
  KnownLicenses.set(license.code, license)
})

export const CUSTOM_LICENSE_CODE: LicenseCode = 1000

export function getLicenseCodeByName(name: string): LicenseCode | undefined {
  for (const [code, license] of KnownLicenses) {
    if (license.name === name) return code
  }
}

export function createKnownLicenseFromCode(code: LicenseCode, attribution?: string): License {
  if (code === CUSTOM_LICENSE_CODE) {
    throw new Error('Use createCustomLicense() instead')
  }

  const knownLicense = KnownLicenses.get(code)

  if (!knownLicense) {
    throw new Error('Unknown License Code')
  }

  const license = new License()

  license.setCode(code)

  if (knownLicense.attributionRequired) {
    if (attribution === undefined) {
      throw new Error('Attribution required for selected license')
    }
    license.setAttribution(attribution)
  }

  return license
}

export function createCustomLicense(customText: string): License {
  const license = new License()

  license.setCode(CUSTOM_LICENSE_CODE)
  license.setCustomText(customText)
  return license
}

export default {
  CUSTOM_LICENSE_CODE,
  KnownLicenses,
  createCustomLicense,
  createKnownLicenseFromCode,
  getLicenseCodeByName,
}
