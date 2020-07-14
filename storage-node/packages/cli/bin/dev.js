'use strict'

const debug = require('debug')('joystream:storage-cli:dev')

// Derivation path appended to well known development seed used on
// development chains
const ALICE_URI = '//Alice'
const ROLE_ACCOUNT_URI = '//Colossus'

function aliceKeyPair(api) {
  return api.identities.keyring.addFromUri(ALICE_URI, null, 'sr25519')
}

function roleKeyPair(api) {
  return api.identities.keyring.addFromUri(ROLE_ACCOUNT_URI, null, 'sr25519')
}

function developmentPort() {
  return 3001
}

const dispatchCalls = async (runtimeApi, senderAddress, rawCalls, batched = false) => {
  const api = runtimeApi.api
  const numCalls = rawCalls.length

  debug(`processing ${numCalls} transactions...`)
  let lastCall

  for (let i = 0; i < numCalls; i++) {
    debug(`${i + 1}/${numCalls} processed.`)
    const { methodName, sectionName, args } = rawCalls[i]
    const tx = api.tx[sectionName][methodName](...args)
    lastCall = runtimeApi.signAndSend(senderAddress, tx)
    if (!batched) {
      await lastCall
    }
  }

  return lastCall
}

const initVstore = async (api, contentLead) => {
  const firstClass = await api.api.rpc.state.getStorage(api.api.query.versionedStore.classById.key(1))

  if (firstClass.isSome) {
    debug('Skipping Initializing Content Directory, classes already exist')
    return
  }

  const classes = require('../../../../devops/vstore/classes.json')
  const entities = require('../../../../devops/vstore/entities.json')

  debug('Initializing Content Directory')

  // batch createClass calls into a single block
  debug('creating classes...')

  const createClasses = classes.filter(call => {
    return call.methodName === 'createClass'
  })

  await dispatchCalls(api, contentLead, createClasses, true)

  // batch addClassSchema calls into a single block
  debug('adding schemas to classes...')
  const addClassSchema = classes.filter(call => {
    return call.methodName === 'addClassSchema'
  })

  await dispatchCalls(api, contentLead, addClassSchema, true)

  debug('creating entities...')

  // Will this not overload the node.. Might not be safe to do on production network
  await dispatchCalls(api, contentLead, entities, true)
}

const check = async api => {
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
const init = async api => {
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
  const sudo = await api.identities.getSudoAccount()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  console.log('Running setup')

  debug('Ensuring Alice is as member..')
  let aliceMemberId = await api.identities.firstMemberIdOf(alice)

  if (aliceMemberId === undefined) {
    debug('Registering Alice as member..')
    aliceMemberId = await api.identities.registerMember(alice, {
      handle: 'alice',
    })
  } else {
    debug('Alice is already a member')
  }

  debug('Setting Alice as content working group lead')
  await api.signAndSend(alice, api.api.tx.sudo.sudo(api.api.tx.contentWorkingGroup.replaceLead([aliceMemberId, alice])))

  await initVstore(api, alice)

  // set localhost colossus as discovery provider
  // assuming pioneer dev server is running on port 3000 we should run
  // the storage dev server on a different port than the default for colossus which is also
  // 3000
  debug('Setting Local development node as bootstrap endpoint')
  await api.discovery.setBootstrapEndpoints(alice, [`http://localhost:${developmentPort()}/`])

  debug('Transferring tokens to storage role account')
  // Give role account some tokens to work with
  api.balances.transfer(alice, roleAccount, 100000)

  // Make alice the storage lead
  debug('Making Alice the storage Lead')
  const leadOpeningId = await api.workers.devAddStorageLeadOpening()
  const leadApplicationId = await api.workers.devApplyOnOpening(leadOpeningId, aliceMemberId, alice, alice)
  api.workers.devBeginLeadOpeningReview(leadOpeningId)
  await api.workers.devFillLeadOpening(leadOpeningId, leadApplicationId)

  const leadAccount = await api.workers.getLeadRoleAccount()
  if (!leadAccount.eq(alice)) {
    throw new Error('Setting alice as lead failed')
  }

  // Create a storage openinging, apply, start review, and fill opening
  debug(`Making ${ROLE_ACCOUNT_URI} account a storage provider`)

  const openingId = await api.workers.devAddStorageOpening()
  debug(`created new storage opening: ${openingId}`)

  const applicationId = await api.workers.devApplyOnOpening(openingId, aliceMemberId, alice, roleAccount)
  debug(`applied with application id: ${applicationId}`)

  api.workers.devBeginStorageOpeningReview(openingId)

  debug(`filling storage opening`)
  const providerId = await api.workers.devFillStorageOpening(openingId, applicationId)

  debug(`Assigned storage provider id: ${providerId}`)

  return check(api)
}

module.exports = {
  init,
  check,
  aliceKeyPair,
  roleKeyPair,
  developmentPort,
}
