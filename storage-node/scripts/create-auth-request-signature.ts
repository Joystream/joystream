#!/usr/bin/env ts-node

import { getAlicePair } from '../src/services/runtime/accounts'
import { cryptoWaitReady } from '@polkadot/util-crypto'
import { UploadTokenRequestBody, signTokenBody, UploadTokenRequest } from '../src/services/helpers/auth'
import { exit } from 'process'

// Wasm init
cryptoWaitReady()
  .then(() => {
    const alice = getAlicePair()

    const tokenRequestBody: UploadTokenRequestBody = {
      memberId: 0,
      accountId: alice.address,
      dataObjectId: parseInt(process.env.OBJECT_ID || '0'),
      storageBucketId: 0,
      bagId: 'static:council',
    }

    const signature = signTokenBody(tokenRequestBody, alice)
    const tokenRequest: UploadTokenRequest = {
      data: tokenRequestBody,
      signature,
    }

    console.log(JSON.stringify(tokenRequest))

    exit(0)
  })
  .catch(console.error)
