'use strict'

import dbug from 'debug'
import { KeyringPair } from '@polkadot/keyring/types'
import { RuntimeApi } from '@joystream/storage-runtime-api'

const debug = dbug('joystream:storage-cli:dev')

// Derivation path appended to well known development seed used on
// development chains
const ALICE_URI = '//Alice'
const ROLE_ACCOUNT_URI = '//Colossus'

function aliceKeyPair(api: RuntimeApi): KeyringPair {
  return api.identities.keyring.addFromUri(ALICE_URI, null, 'sr25519')
}

function roleKeyPair(api: RuntimeApi): KeyringPair {
  return api.identities.keyring.addFromUri(ROLE_ACCOUNT_URI, null, 'sr25519')
}

function getKeyFromAddressOrSuri(api: RuntimeApi, addressOrSuri: string) {
  // Get key from keyring if it is an address
  try {
    return api.identities.keyring.getPair(addressOrSuri)
  } catch (err) {
    debug('supplied argument was not an address')
  }

  // Assume a SURI, add to keyring and return keypair
  return api.identities.keyring.addFromUri(addressOrSuri, null, 'sr25519')
}

function developmentPort(): number {
  return 3001
}

// Checks the chain state for the storage provider setup we expect
// to have if the initialization was successfully run prior.
// Returns the provider id if found, throws otherwise.
const check = async (api): Promise<any> => {
  const roleAccountId = roleKeyPair(api).address
  const providerId = await api.workers.findProviderIdByRoleAccount(roleAccountId)

  if (providerId === null) {
    throw new Error('Dev storage provider not found on chain.')
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
const init = async (api: RuntimeApi): Promise<any> => {
  debug('Ensuring we are on Development chain')
  if (!(await api.system.isDevelopmentChain())) {
    console.log('This command should only be run on a Development chain')
    return
  }

  // check if the initialization was previously run, skip if so.
  try {
    await check(api)
    return
  } catch (err) {
    // We didn't find a storage provider with expected role account
  }

  // Load alice keypair into keyring
  const alice = aliceKeyPair(api).address
  const roleAccount = roleKeyPair(api).address

  debug(`Ensuring Alice ${alice} is sudo.`)

  // make sure alice is sudo - indirectly checking this is a dev chain
  const sudo = await api.identities.getSudoAccount()

  if (!sudo.eq(alice)) {
    throw new Error('Setup requires Alice to be sudo. Are you sure you are running a devchain?')
  }

  console.log('Running setup.')

  debug('Ensuring Alice is as member.')
  let aliceMemberId = await api.identities.firstMemberIdOf(alice)

  if (aliceMemberId === undefined) {
    debug('Registering Alice as member.')
    aliceMemberId = await api.identities.registerMember(alice, {
      handle: 'alice',
    })
  } else {
    debug('Alice is already a member.')
  }

  debug('Transferring tokens to storage role account.')
  // Give role account some tokens to work with
  api.balances.transfer(alice, roleAccount, 100000)

  // Make alice the storage lead
  debug('Making Alice the storage Lead.')
  const leadOpeningId = await api.workers.devAddStorageLeadOpening()
  const leadApplicationId = await api.workers.devApplyOnOpening(leadOpeningId, aliceMemberId, alice, alice)
  await api.workers.devFillLeadOpening(leadOpeningId, leadApplicationId)

  const leadAccount = await api.workers.getLeadRoleAccount()
  if (!leadAccount.eq(alice)) {
    throw new Error('Setting alice as lead failed.')
  }

  // Create a storage openinging, apply, start review, and fill opening
  debug(`Making ${ROLE_ACCOUNT_URI} account a storage provider.`)

  const openingId = await api.workers.devAddStorageOpening()
  debug(`Created new storage opening: ${openingId}`)

  const applicationId = await api.workers.devApplyOnOpening(openingId, aliceMemberId, alice, roleAccount)
  debug(`Applied with application id: ${applicationId}`)

  debug(`Filling storage opening.`)
  const providerId = await api.workers.devFillStorageOpening(openingId, applicationId)

  debug(`Assigned storage provider id: ${providerId}`)

  return check(api)
}

// Using sudo to create initial storage lead and worker with given keys taken from env variables.
// Used to quickly setup a storage provider on a new chain before a council is ready.
const makeMemberInitialLeadAndStorageProvider = async (api: RuntimeApi): Promise<any> => {
  if (await api.workers.getLeadRoleAccount()) {
    throw new Error('The Storage Lead is already set!')
  }

  if (!process.env.SUDO_URI) {
    throw new Error('required SUDO_URI env variable was not set')
  }

  if (!process.env.MEMBER_ID) {
    throw new Error('required MEMBER_ID env variable was not set')
  }

  if (!process.env.MEMBER_CONTROLLER_URI) {
    throw new Error('required MEMBER_CONTROLLER_URI env variable was not set')
  }

  if (!process.env.STORAGE_WORKER_ADDRESS) {
    throw new Error('required STORAGE_WORKER_ADDRESS env variable was not set')
  }

  const sudoKey = getKeyFromAddressOrSuri(api, process.env.SUDO_URI)
  const memberId = parseInt(process.env.MEMBER_ID)
  const memberController = getKeyFromAddressOrSuri(api, process.env.MEMBER_CONTROLLER_URI).address
  const leadAccount = memberController
  const workerAccount = process.env.STORAGE_WORKER_ADDRESS

  const sudo = await api.identities.getSudoAccount()

  // Ensure correct sudo key was provided
  if (!sudo.eq(sudoKey.address)) {
    throw new Error('Provided SUDO_URI is not the chain sudo')
  }

  // Ensure MEMBER_ID and MEMBER_CONTROLLER_URI are valid
  const memberIds = await api.identities.memberIdsOfController(memberController)
  if (memberIds.find((id) => id.eq(memberId)) === undefined) {
    throw new Error(
      'MEMBER_ID and MEMBER_CONTROLLER_URI do not correspond to a registered member and their controller account'
    )
  }

  // Ensure STORAGE_WORKER_ADDRESS is a valid Address
  api.identities.keyring.decodeAddress(workerAccount)

  debug(`Creating Leader with role key: ${leadAccount}`)
  debug('Creating Lead Opening')
  const leadOpeningId = await api.workers.devAddStorageLeadOpening()
  debug('Applying')
  const leadApplicationId = await api.workers.devApplyOnOpening(leadOpeningId, memberId, memberController, leadAccount)
  debug('Filling Opening')
  await api.workers.devFillLeadOpening(leadOpeningId, leadApplicationId)

  const setLeadAccount = await api.workers.getLeadRoleAccount()
  if (!setLeadAccount.eq(leadAccount)) {
    throw new Error('Setting Lead failed!')
  }

  // Create a storage openinging, apply, start review, and fill opening
  debug(`Making ${workerAccount} account a storage provider.`)

  const openingId = await api.workers.devAddStorageOpening()
  debug(`Created new storage opening: ${openingId}`)

  const applicationId = await api.workers.devApplyOnOpening(openingId, memberId, memberController, workerAccount)
  debug(`Applied with application id: ${applicationId}`)

  debug(`Filling storage opening.`)
  const providerId = await api.workers.devFillStorageOpening(openingId, applicationId)

  debug(`Assigned storage provider id: ${providerId}`)
}

export { init, check, aliceKeyPair, roleKeyPair, developmentPort, makeMemberInitialLeadAndStorageProvider }
