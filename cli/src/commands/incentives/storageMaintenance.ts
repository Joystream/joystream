import { flags } from '@oclif/command'
import IncentivesCommandBase, { StorageBucketData } from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class StorageMaintenance extends IncentivesCommandBase {
  static description = 'Gets storage replication statistics'
  static args = [
    {
      name: 'startBlockInput',
      required: true
    },
    {
      name: 'endBlockInput',
      required: true,
    },
  ]
  static flags = {
    spotchecksBlocks: flags.string({
      char: 's',
      required: true,
      description: 'The blocks to measeure at, as comma separated blockheights. Only the last one will count for version',
    }),
    minReplication: flags.integer({
      char: 'm',
      required: true,
      description: 'Minimum required replication',
    }),
    excessReplication: flags.integer({
      char: 'e',
      required: true,
      description: 'Minimum required replication',
    }),
    latestVersion: flags.string({
      char: 'l',
      required: true,
      description: 'Latest version of colossus, eg -l "2.0.0"',
    }),
    ignoreBags: flags.string({
      char: 'i',
      required: false,
      description: 'Comma separated list of bags to ignore, eg. -i=1,2,4,99',
    }),
    ...IncentivesCommandBase.flags,
  }
  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(StorageMaintenance).args
    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    const { spotchecksBlocks, minReplication, ignoreBags, excessReplication,latestVersion } = this.parse(StorageMaintenance).flags
    const blocks:number[] = []
    spotchecksBlocks.split(",").forEach((a) => {
      blocks.push(parseInt(a))
    })
    let startDateTime = await this.getTimestamps(startBlock)
    let endDateTime = await this.getTimestamps(endBlock)
    console.log("startDateTime,endDateTime",startDateTime,endDateTime)
    
    const bagsToIgnore:string[] = []
    if (ignoreBags) {
      ignoreBags.split(",").forEach((a) => {
        bagsToIgnore.push(`dynamic:channel:${a}`)
      })
    }
    const hashes:string[] = []
    let dynamic_configuration_score_i = 0
    const startHash = await this.getBlockHash(startBlock)
    const endHash = await this.getBlockHash(endBlock)
    const startObjects = (await this.getOriginalApi().query.storage.nextDataObjectId.at(startHash)).toNumber()
    const endObjects = (await this.getOriginalApi().query.storage.nextDataObjectId.at(endHash)).toNumber()
    this.log(`There was ${startObjects} at the start of the term, and ${endObjects} at the end -> ${endObjects-startObjects} objects uploaded during the period.`)
    for (let block of blocks) {
      const hash = await this.getBlockHash(block)
      hashes.push(hash)
      const policyAt = await this.getDynamicBagCreationPoliciesAt(hash,"Channel")
      dynamic_configuration_score_i += Math.min(Math.max(policyAt.numberOfStorageBuckets.toNumber()-(minReplication-1),0),1)
      this.log(`At block #${block} the dynamic policy was ${policyAt.numberOfStorageBuckets.toNumber()} -> dynamic_configuration_score_i = ${dynamic_configuration_score_i}`)
    }
    const dynamic_configuration_score = dynamic_configuration_score_i/blocks.length
    this.log(`-> dynamic_configuration_score = ${dynamic_configuration_score}`)

    const workerData: StorageBucketData[][] = []
    for (let i=0; i<blocks.length; i++) {
      const workerDataAt = await this.getStorageWorkersAt(hashes[i])
      workerData.push(workerDataAt)
    }
    

    const storageBucketsData = await this.getQNApi().storageBucketsData()
    const latest:[number,string,string][] = []
    const notLatest:[number,string,string][] = []
    const notReached:[number,string,string][] = []
    for (let bucket of storageBucketsData) {
      let endpointUrl = bucket.operatorMetadata?.nodeEndpoint ?? undefined
      if (endpointUrl) {
      } else {
        endpointUrl = "not set"
      }
      if (bucket.operatorMetadata) {
        const versionJson = await this.getColossusData(endpointUrl,"version")
        const version: string = versionJson.version
        for (let operator of workerData[workerData.length-1]) {
          if (operator.bucketId == parseInt(bucket.id)) {
            operator.endpointUrl = endpointUrl
            operator.nodeVersion = version
            if (version == latestVersion) {
              latest.push([operator.bucketId,endpointUrl,version])
            } else if (version == "not reachable") {
              notReached.push([operator.bucketId,endpointUrl,version])
            } else {
              notLatest.push([operator.bucketId,endpointUrl,version])
            }
          }
        }
      }
    }
    this.log(`For the workers at block ${blocks[blocks.length-1]}, there were:`)
    this.log(`  - ${latest.length} nodes running version ${latestVersion}`)
    this.log(`  - ${notReached.length} nodes were either not up, or not displaying the version`)
    this.log(`  - ${notLatest.length} nodes running OTHER versions`)

    const newBagIds:string[] = []
    let firstChannelId = 2000
    let lastChannelId = 2000
    const newChannels = await this.getQNApi().channelsCreatedBetweenBlocks(startBlock,endBlock)
    for (let channel of newChannels) {
      newBagIds.push(`dynamic:channel:${channel.id}`)
      if (parseInt(channel.id) > lastChannelId) {
        lastChannelId = parseInt(channel.id)
      }
    }

    let excessReplicationBags = 0
    let existing_bag_configuration_score = 1
    const bagsUnderTreshold:[string,number][] = []
    for (let i=firstChannelId; i<lastChannelId; i++) {
      const channelId = this.createType("ChannelId",i)
      const bagId = `dynamic:channel:${i.toString()}`
      const bag = await this.getOriginalApi().query.storage.bags.at(endHash,{ Dynamic: { Channel: channelId }})
      const storedBy = bag.stored_by.strings.length
      if (storedBy <= minReplication && !bagsToIgnore.includes(bagId)) {
        existing_bag_configuration_score = 0
        bagsUnderTreshold.push([bagId,storedBy])
      }
    }
    console.log("New Bags",newBagIds.length)
    this.log(`Out of ${lastChannelId-firstChannelId} bags, there are ${excessReplicationBags} in more than ${excessReplication} buckets`)
    this.log(`Out of ${lastChannelId-firstChannelId} bags, ${bagsUnderTreshold.length} are in fewer than ${minReplication} buckets`)
    this.log(`existing_bag_configuration_score = ${existing_bag_configuration_score}`)
  }
}