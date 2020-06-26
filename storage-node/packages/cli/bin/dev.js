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
  debug('Setting Alice as Lead')
  // prepare set storage lead tx
  const setLeadTx = api.api.tx.storageWorkingGroup.setLead(aliceMemberId, alice)
  // make sudo call
  api.signAndSend(
    alice,
    api.api.tx.sudo.sudo(setLeadTx)
  )

  // create an openinging, apply, start review, fill opening
  debug(`Making ${ROLE_ACCOUNT_URI} account a storage provider`)

  const openTx = api.api.tx.storageWorkingGroup.addWorkerOpening('CurrentBlock', {
    application_rationing_policy: {
      'max_active_applicants': 1
    },
    max_review_period_length: 1000
    // default values for everything else..
  }, 'dev-opening')

  const openingId = await api.signAndSendThenGetEventResult(alice, openTx, {
    eventModule: 'storageWorkingGroup',
    eventName: 'WorkerOpeningAdded',
    eventProperty: 'WorkerOpeningId'
  })
  debug(`created new opening id ${openingId}`)

  const applyTx = api.api.tx.storageWorkingGroup.applyOnWorkerOpening(
    aliceMemberId, openingId, roleAccount, null, null, 'colossus'
  )
  const applicationId = await api.signAndSendThenGetEventResult(alice, applyTx, {
    eventModule: 'storageWorkingGroup',
    eventName: 'AppliedOnWorkerOpening',
    eventProperty: 'WorkerApplicationId'
  })
  debug(`created application id ${applicationId}`)

  const reviewTx = api.api.tx.storageWorkingGroup.beginWorkerApplicantReview(openingId)
  api.signAndSend(alice, reviewTx)

  const fillTx = api.api.tx.storageWorkingGroup.fillWorkerOpening(openingId, [applicationId], null)
  const filledMap = await api.signAndSendThenGetEventResult(alice, fillTx, {
    eventModule: 'storageWorkingGroup',
    eventName: 'WorkerOpeningFilled',
    eventProperty: 'WorkerApplicationIdToWorkerIdMap'
  })

  if (filledMap.size === 0) {
    throw new Error('Expected opening to be filled!')
  }

  let ourApplicationIdKey

  for (let key of filledMap.keys()) {
    if (key.eq(applicationId)) {
      ourApplicationIdKey = key
      break
    }
  }

  if (!ourApplicationIdKey) {
    throw new Error('Expected our application id to have been filled!')
  }

  const providerId = filledMap.get(ourApplicationIdKey)

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
