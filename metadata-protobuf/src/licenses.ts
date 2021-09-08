// Helper methods to handle joystream defined license types
// This should be factored out into a separate package

import LICENSES from './KnownLicenses.json'
import { License } from '../compiled/index'

export type LicenseCode = number
export const CUSTOM_LICENSE_CODE: LicenseCode = 1000

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

  const license = new License({ code })

  if (knownLicense.attributionRequired) {
    if (attribution === undefined) {
      throw new Error('Attribution required for selected license')
    }
    license.attribution = attribution
  }

  return license
}

export function createCustomKnownLicense(customText: string): License {
  return new License({ code: CUSTOM_LICENSE_CODE, customText })
}

export default {
  CUSTOM_LICENSE_CODE,
  KnownLicenses,
  createCustomKnownLicense,
  createKnownLicenseFromCode,
  getLicenseCodeByName,
}
