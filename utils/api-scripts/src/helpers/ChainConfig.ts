import { getRegistry } from '@substrate/txwrapper-registry'

/*
curl -X 'GET' \
  'https://api-sidecar.joystream.org/transaction/material?noMeta=false&metadata=json' \
  -H 'accept: application/json'

  {
      "at": {
          "hash": "0xe115a91b1858bf8fac932d5c7aad1f0c0a9fead94c98b010dc9d5a7cce8b03e9",
          "height": "10493990"
      },
      "genesisHash": "0x6b5e488e0fa8f9821110d5c13f4c468abcd43ce5e297e62b34c53c3346465956",
      "chainName": "Joystream",
      "specName": "joystream-node",
      "specVersion": "2004",
      "txVersion": "2",
      "metadata": { .... }
  }
*/

export const JOYSTREAM_CHAIN_CONFIG = {
  chainName: 'Joystream',
  specName: 'joystream-node',
  specVersion: 2004,
  metadataRpc: require('./joystream-metadata.json'),
  transactionVersion: 2,
  genesisHash: '0x6b5e488e0fa8f9821110d5c13f4c468abcd43ce5e297e62b34c53c3346465956',
  registry: getRegistry({
    chainName: 'Joystream',
    specName: 'joystream-node',
    specVersion: 2004,
    metadataRpc: require('./joystream-metadata.json'),
  }),
}
