import axios from 'axios'

export async function fetchAccountNextIndex(account: string, rpcUrl: string): Promise<string | null> {
  const response = await axios.post(rpcUrl, {
    jsonrpc: '2.0',
    method: 'system_accountNextIndex',
    params: [account],
    id: 1,
  })

  if (response.data && response.data.result !== undefined) {
    return response.data.result
  } else {
    console.error('Error fetching nonce:', response.data.error || 'Unknown error')
    return null
  }
}

export async function submitExtrinsic(signedTx: string, rpcUrl: string): Promise<string | undefined> {
  const response = await axios.post(rpcUrl, {
    jsonrpc: '2.0',
    method: 'author_submitExtrinsic',
    params: [signedTx],
    id: 1,
  })

  if (response.data && response.data.result) {
    console.log(`Transaction submitted Hash: ${response.data.result}`)
    return response.data.result
  } else if (response.data.error) {
    console.error('Error submitting transaction:', response.data.error.message)
  } else {
    console.error('Unknown error:', response.data)
  }
}
