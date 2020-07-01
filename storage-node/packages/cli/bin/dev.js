/* eslint-disable no-console */

'use strict'

const debug = require('debug')('joystream:storage-cli:dev')
const assert = require('assert')

// Derivation path appended to well known development seed used on
// development chains
const ALICE_URI = '//Alice'
const ROLE_ACCOUNT_URI = '//Colossus'

function aliceKeyPair (api) {
  return api.identities.keyring.addFromUri(ALICE_URI, null, 'sr25519')
}

function roleKeyPair (api) {
  return api.identities.keyring.addFromUri(ROLE_ACCOUNT_URI, null, 'sr25519')
}

function developmentPort () {
  return 3001
}

const check = async (api) => {
  const roleAccountId = roleKeyPair(api).address
  const providerId = await api.workers.findProviderIdByRoleAccount(roleAccountId)

  if (providerId === null) {
    throw new Error('Dev storage provider not found on chain!')
  }

  console.log(`
  Chain is setup with Dev storage provider:
    providerId = ${providerId}
    roleAccountId = ${roleAccountId}
    roleKey = ${ROLE_ACCOUNT_URI}
  `)

  return providerId
}

// Setup Alice account on a developement chain as
// a member, storage lead, and a storage provider using a deterministic
// development key for the role account
const init = async (api) => {
  try {
    await check(api)
    return
  } catch (err) {
    // We didn't find a storage provider with expected role account
  }

  const alice = aliceKeyPair(api).address
  const roleAccount = roleKeyPair(api).address

  debug(`Ensuring Alice is sudo`)

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await api.api.query.sudo.key()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  console.log('Running setup')

  // set localhost colossus as discovery provider
  // assuming pioneer dev server is running on port 3000 we should run
  // the storage dev server on a different port than the default for colossus which is also
  // 3000
  debug('Setting Local development node as bootstrap endpoint')
  await api.discovery.setBootstrapEndpoints(alice, [`http://localhost:${developmentPort()}/`])

  debug('Transferring tokens to storage role account')
  // Give role account some tokens to work with
  api.balances.transfer(alice, roleAccount, 100000)

  debug('Ensuring Alice is as member..')
  let aliceMemberId = await api.identities.firstMemberIdOf(alice)

  if (aliceMemberId === undefined) {
    debug('Registering Alice as member..')
    aliceMemberId = await api.identities.registerMember(alice, {
      handle: 'alice'
    })
  } else {
    debug('Alice is already a member')
  }

  // Make alice the storage lead
  debug('Making Alice the storage Lead')
  const leadOpeningId = await api.workers.dev_addStorageLeadOpening(alice)
  const leadApplicationId = await api.workers.dev_applyOnOpening(leadOpeningId, aliceMemberId, alice, alice)
  api.workers.dev_beginLeadOpeningReview(leadOpeningId, alice)
  api.workers.dev_fillLeadOpening(leadOpeningId, leadApplicationId, alice)

  // Create a storage openinging, apply, start review, and fill opening
  debug(`Making ${ROLE_ACCOUNT_URI} account a storage provider`)

  const openingId = await api.workers.dev_addStorageOpening(alice)
  debug(`created new opening id ${openingId}`)

  const applicationId = await api.workers.dev_applyOnOpening(openingId, aliceMemberId, alice, roleAccount)
  debug(`created application id ${applicationId}`)

  api.workers.dev_beginStorageOpeningReview(openingId, alice)

  debug(`filling storage opening`)
  const providerId = await api.workers.dev_fillStorageOpening(openingId, applicationId, alice)

  debug(`Assigned storage provider id: ${providerId}`)

  return check(api)
}

module.exports = {
  init,
  check,
  aliceKeyPair,
  roleKeyPair,
  developmentPort
}
