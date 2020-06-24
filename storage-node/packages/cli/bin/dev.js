/* eslint-disable no-console */

'use strict'

const debug = require('debug')('joystream:storage-cli:dev')

function aliceKeyPair (api) {
  return api.identities.keyring.addFromUri('//Alice', null, 'sr25519')
}

function roleKeyPair (api) {
  return api.identities.keyring.addFromUri('//Colossus', null, 'sr25519')
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
    roleKey = '//Colossus'
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
    // setup is not correct we can try to run setup
  }

  const alice = aliceKeyPair(api).address
  const roleAccount = roleKeyPair(api).address
  const providerId = 0 // first assignable id

  debug(`Checking for dev chain...`)

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await api.api.query.sudo.key()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  console.log('Setting up chain...')

  debug('Transfering tokens to storage role account')
  // Give role account some tokens to work with
  api.balances.transfer(alice, roleAccount, 100000)

  console.log('Registering Alice as Member')
  // register alice as a member
  const aliceMemberId = await api.identities.registerMember(alice, {
    handle: 'alice'
  })

  // if (!aliceMemberId.eq(0)) {
  //   // not first time script is running!
  // }

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
  // Assumption opening id and applicant id, provider id will all be the
  // first assignable id == 0
  // so we don't await each tx to finalize to get the ids. this allows us to
  // batch all the transactions into a single block.
  debug('Making //Colossus account a storage provider')
  const openTx = api.api.tx.storageWorkingGroup.addWorkerOpening('CurrentBlock', {
    application_rationing_policy: {
      'max_active_applicants': 1
    },
    max_review_period_length: 1000
    // default values for everything else..
  }, 'opening0')
  api.signAndSend(alice, openTx)
  const openingId = 0 // first assignable opening id
  const applyTx = api.api.tx.storageWorkingGroup.applyOnWorkerOpening(
    aliceMemberId, openingId, roleAccount, null, null, 'colossus'
  )
  api.signAndSend(alice, applyTx)
  const applicantId = 0 // first assignable applicant id

  const reviewTx = api.api.tx.storageWorkingGroup.beginWorkerApplicantReview(openingId)
  api.signAndSend(alice, reviewTx)

  const fillTx = api.api.tx.storageWorkingGroup.fillWorkerOpening(openingId, [applicantId], null)
  await api.signAndSend(alice, fillTx)

  // wait for previous transactions to finalize so we can read correct state
  if (await api.workers.isRoleAccountOfStorageProvider(providerId, roleAccount)) {
    console.log('Storage Role setup Completed Successfully')
  } else { throw new Error('Setup Failed') }

  // set localhost colossus as discovery provider on default port
  // assuming pioneer dev server is running on port 3000 we should run
  // the storage dev server on port 3001
  debug('Setting Local development node as bootstrap endpoint')
  await api.discovery.setBootstrapEndpoints(alice, ['http://localhost:3001/'])
}

module.exports = {
  init,
  check,
  aliceKeyPair,
  roleKeyPair
}
