import BN from 'bn.js'

// Workaround for invalid BN variant fields serialization
BN.prototype.toJSON = function () {
  return this.toString()
}

export * from './content'
export * from './membership'
export * from './storage'
export * from './workingGroups'
export * from './proposals'
export * from './proposalsDiscussion'
export * from './forum'
