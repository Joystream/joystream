const debug = require('debug')('joystream:storage-cli:dev')

function aliceKeyPair (api) {
  return api.identities.keyring.addFromUri('//Alice', null, 'sr25519')
}

function roleKeyPair (api) {
  return api.identities.keyring.addFromUri('//Colossus', null, 'sr25519')
}

// Setup Alice account on a developement chain that was
// just launched as the storage lead, and a storage provider using the same
// key as the role key
const init = async (api) => {
  try {
    return await check(api)
  } catch (err) {
    // setup is not correct we can try to run setup
  }

  const alice = aliceKeyPair(api).address
  const roleAccount = roleKeyPair(api).address
  const providerId = 0 // first assignable id

  console.log(`Checking for dev chain...`)

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await api.api.query.sudo.key()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  console.log('Setting up chain...')

  debug('Transfering tokens to storage role account')
  // Give role account some tokens to work with
  api.balances.transfer(alice, roleAccount, 100000)

  debug('Registering Alice as Member')
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

const check = async (api) => {
  const providerId = 0 // the first provider id which would have been assigned in dev-init
  const roleAccountId = roleKeyPair(api).address
  const alice = aliceKeyPair(api).address

  if (await api.workers.isRoleAccountOfStorageProvider(providerId, roleAccountId)) {
    console.log(`
      Chain is setup with Alice as a storage provider:
      providerId = ${providerId}
      roleAccount = "//Colossus"
    `)
  } else { throw new Error('Alice is not a storage provider') }

  const currentLead = await api.api.query.storageWorkingGroup.currentLead()

  if (currentLead.isSome && currentLead.unwrap().role_account_id.eq(alice)) {
    console.log(`
      Alice is correctly setup as the storage lead
    `)
  } else {
    throw new Error('Alice is not the storage lead!')
  }
}

module.exports = {
  init,
  check,
  aliceKeyPair,
  roleKeyPair
}
