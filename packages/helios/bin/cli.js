#!/usr/bin/env node

const { RuntimeApi } = require('@joystream/runtime-api');
const { encodeAddress } = require('@polkadot/keyring')
const { discover } = require('@joystream/discovery');
const axios = require('axios');

(async function main () {

  const runtime = await RuntimeApi.create();
  const api  = runtime.api;

  // get current blockheight
  const currentBlock = await api.rpc.chain.getHeader();
  const currentHeight = currentBlock.blockNumber;

  // get all providers
  const storageProviders = await api.query.actors.accountIdsByRole(0);

  const storageProviderAccountInfos = await Promise.all(storageProviders.map(async (account) => {
    return ({
      account,
      info: await runtime.discovery.getAccountInfo(account),
      joined: (await api.query.actors.actorByAccountId(account)).unwrap().joined_at
    });
  }));

  const liveProviders = storageProviderAccountInfos.filter(({account, info}) => {
    return info && info.expires_at.gte(currentHeight)
  });

  const downProviders = storageProviderAccountInfos.filter(({account, info}) => {
    return info == null
  });

  const expiredTtlProviders = storageProviderAccountInfos.filter(({account, info}) => {
    return info && currentHeight.gte(info.expires_at)
  });

  let providersStatuses = mapInfoToStatus(liveProviders, currentHeight);
  console.log('\n== Live Providers\n', providersStatuses);

  let expiredProviderStatuses = mapInfoToStatus(expiredTtlProviders, currentHeight)
  console.log('\n== Expired Providers\n', expiredProviderStatuses);

  // check when actor account was created consider grace period before removing
  console.log('\n== Down Providers!\n', downProviders.map(provider => {
    return ({
      account: provider.account.toString(),
      age: currentHeight.sub(provider.joined).toNumber()
    })
  }));

  // Resolve IPNS identities of providers
  console.log('\nResolving provider API Endpoints...')
  providersStatuses = providersStatuses.concat(expiredProviderStatuses);
  let endpoints = await Promise.all(providersStatuses.map(async (status) => {
    try {
      let serviceInfo = await discover.discover_over_joystream_discovery_service(status.address, runtime);
      let info = JSON.parse(serviceInfo.serialized);
      console.log(`${status.address} -> ${info.asset.endpoint}`);
      return { address: status.address, endpoint: info.asset.endpoint};
    } catch (err) {
      console.log(err.message, 'failed resolving provider:', status.address)
    }
  }));

  console.log('\nChecking API Endpoint is online')
  await Promise.all(endpoints.map(async (provider) => {
    const swaggerUrl = `${removeEndingForwardSlash(provider.endpoint)}/swagger.json`;
    let error;
    try {
      await axios.get(swaggerUrl)
    } catch (err) {error = err}
    console.log(`${provider.endpoint} - ${error ? error.message : 'OK'}`);
  }));

  // after resolving for each resolved provider, HTTP HEAD with axios all known content ids
  // report available/known
  let knownContentIds = await runtime.assets.getKnownContentIds()

  console.log(`\nContent Directory has ${knownContentIds.length} assets`);

  await Promise.all(knownContentIds.map(async (contentId) => {
    let [relationships, judgement] = await assetRelationshipState(api, contentId, storageProviders);
    console.log(`${encodeAddress(contentId)} replication ${relationships}/${storageProviders.length} - ${judgement}`);
  }));

  console.log('\nChecking available assets on providers...');
  endpoints.map(async ({address, endpoint}) => {
    let count = await countContentAvailability(knownContentIds, endpoint);
    console.log(`${address}: has ${count} assets`);
  });

  // interesting disconnect doesn't work unless an explicit provider was created
  // for underlying api instance
  runtime.api.disconnect();
})();

function mapInfoToStatus(providers, currentHeight) {
  return providers.map(({account, info, joined}) => {
    if (info) {
      return {
        address: account.toString(),
        age: currentHeight.sub(joined).toNumber(),
        identity: info.identity.toString(),
        expiresIn: info.expires_at.sub(currentHeight).toNumber(),
        expired: currentHeight.gte(info.expires_at),
      }
    } else {
      return {
        address: account.toString(),
        identity: null,
        status: 'down'
      }
    }
  })
}

async function countContentAvailability(contentIds, source) {
  let found = 0;
  for(let i = 0; i < contentIds.length; i++) {
    const assetUrl = makeAssetUrl(contentIds[i], source);
    try {
      await axios.head(assetUrl)
      found++
    } catch(err) { console.log(`${assetUrl} ${err.message}`); continue; }
  }
  return found;
}

function makeAssetUrl(contentId, source) {
  source = removeEndingForwardSlash(source);
  return `${source}/asset/v0/${encodeAddress(contentId)}`
}

// return url with last `/` removed
function removeEndingForwardSlash(url) {
  let st = new String(url)
  if (st.endsWith('/')) {
    return st.substring(0, st.length - 1);
  }
  return st.toString()
}

async function assetRelationshipState(api, contentId, providers) {
  let dataObject = await api.query.dataDirectory.dataObjectByContentId(contentId);

  // how many relationships out of active providers?
  let relationshipIds = await api.query.dataObjectStorageRegistry.relationshipsByContentId(contentId);

  let activeRelationships = await Promise.all(relationshipIds.map(async (id) => {
    let relationship = await api.query.dataObjectStorageRegistry.relationships(id);
    relationship = relationship.unwrap()
    return providers.find((provider) => relationship.storage_provider.eq(provider))
  }));

  return [activeRelationships.filter(active => active).length, dataObject.unwrap().liaison_judgement]
}