const assert = require('assert')

function aliceKeyPair (api) {
  return api.identities.keyring.addFromUri('//Alice', null, 'sr25519')
}

// Setup Alice account on a developement chain that was
// just launched as the storage lead, and a storage provider using the same
// key as the role key
const init = async (api) => {
  const alice = aliceKeyPair(api).address
  const providerId = 0 // first assignable id

  // Check if setup already completed
  if (await api.workers.isRoleAccountOfStorageProvider(providerId, alice)) {
    console.log('Alice already setup as a storage provider')
    return
  }

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await api.api.query.sudo.key()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  // register alice as a member
  console.log(`Registering Alice as a member`)
  const aliceMemberId = await api.identities.registerMember(alice, {
    handle: 'alice'
  })

  // Make alice the storage lead
  console.log('Setting Alice as Lead')
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
  console.log('Making Alice a storage provider')
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
    aliceMemberId, openingId, alice, null, null, 'alice'
  )
  api.signAndSend(alice, applyTx)
  const applicantId = 0 // first assignable applicant id

  const reviewTx = api.api.tx.storageWorkingGroup.beginWorkerApplicantReview(openingId)
  api.signAndSend(alice, reviewTx)

  const fillTx = api.api.tx.storageWorkingGroup.fillWorkerOpening(openingId, [applicantId], null)

  await api.signAndSend(alice, fillTx)

  // const worker = await api.workers.storageWorkerByProviderId(providerId)
  if (await api.workers.isRoleAccountOfStorageProvider(providerId, alice)) {
    console.log('Setup Alice successfully as storage provider')
  } else { throw new Error('Setup Failed') }

  // set localhost colossus as discovery provider on default port
  await api.discovery.setBootstrapEndpoints(alice, ['http://localhost:3000/'])
}

const check = async (api) => {
  const providerId = 0 // the first provider id which would have been assigned in dev-init
  const roleAccountId = aliceKeyPair(api).address

  if (await api.workers.isRoleAccountOfStorageProvider(providerId, roleAccountId)) {
    console.log('Alice is correctly setup as a storage provider')
  } else { throw new Error('Alice is not setup as a storage provider') }

  const currentLead = await api.api.query.storageWorkingGroup.currentLead()

  if (currentLead.isSome && currentLead.unwrap().role_account_id.eq(roleAccountId)) {
    console.log('Alice is correctly setup as the storage lead')
  } else { throw new Error('Alice is not the storage lead') }
}

module.exports = {
  init,
  check,
  aliceKeyPair
}
