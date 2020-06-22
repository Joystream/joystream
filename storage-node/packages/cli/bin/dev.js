function aliceKeyPair (runtime_api) {
  return runtime_api.identities.keyring.addFromUri('//Alice', null, 'sr25519')
}

// Setup Alice account on a developement chain that was
// just launched as the storage lead, and a storage provider using the same
// key as the role key
const init = async (runtime_api) => {
  const alice = aliceKeyPair(runtime_api).address
  const providerId = 0 // first assignable id

  // Check if setup already completed
  if (await runtime_api.workers.isRoleAccountOfStorageProvider(providerId, alice)) {
    console.log('Alice already setup as a storage provider')
    return
  }

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await runtime_api.api.query.sudo.key()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  // register alice as a member if not already registered
  console.log(`Registering Alice as a member`)
  const aliceMemberId = 0 // first assignable id
  runtime_api.identities.registerMember(alice, {
    handle: 'alice'
  })

  // Make alice the storage lead
  // prepare set storage lead tx
  const setLeadTx = runtime_api.api.tx.storageWorkingGroup.setLead(aliceMemberId, alice)
  // make sudo call
  console.log('Setting Alice as Lead')
  runtime_api.signAndSend(
    alice,
    runtime_api.api.tx.sudo.sudo(setLeadTx)
  )

  // create an openinging, apply, start review, fill opening
  // Assumption opening id and applicant id, provider id will all be the first ids == 0
  // so we don't await each tx to finalize to get the ids. this allows us to
  // batch all the transactions into a single block.
  console.log('Making Alice a storage provider')
  const openTx = runtime_api.api.tx.storageWorkingGroup.addWorkerOpening('CurrentBlock', {
    application_rationing_policy: {
      'max_active_applicants': 1
    },
    max_review_period_length: 1000
    // default values for everything else..
  }, 'opening0')
  runtime_api.signAndSend(alice, openTx)
  const openingId = 0 // first id
  const applyTx = runtime_api.api.tx.storageWorkingGroup.applyOnWorkerOpening(
    aliceMemberId, openingId, alice, null, null, 'alice'
  )
  runtime_api.signAndSend(alice, applyTx)
  const applicantId = 0 // first applicant id

  const reviewTx = runtime_api.api.tx.storageWorkingGroup.beginWorkerApplicantReview(openingId)
  runtime_api.signAndSend(alice, reviewTx)

  const fillTx = runtime_api.api.tx.storageWorkingGroup.fillWorkerOpening(openingId, [applicantId], null)

  await runtime_api.signAndSend(alice, fillTx)

  // const worker = await runtime_api.workers.storageWorkerByProviderId(providerId)
  if (await runtime_api.workers.isRoleAccountOfStorageProvider(providerId, alice)) {
    console.log('Setup Successful')
  } else { throw new Error('Setup Failed') }
}

const check = async (runtime_api) => {
  const providerId = 0
  const roleAccountId = aliceKeyPair(runtime_api).address

  if (await runtime_api.workers.isRoleAccountOfStorageProvider(providerId, roleAccountId)) {
    console.log('Alice is correctly setup as a storage provider')
  } else { throw new Error('Alice is not setup as a storage provider') }

  const currentLead = await runtime_api.api.query.storageWorkingGroup.currentLead()

  if (currentLead.isSome && currentLead.unwrap().role_account_id.eq(roleAccountId)) {
    console.log('Alice is correctly setup as the storage lead')
  } else { throw new Error('Alice is not the storage lead') }
}
module.exports = {
  init,
  check,
  aliceKeyPair
}
