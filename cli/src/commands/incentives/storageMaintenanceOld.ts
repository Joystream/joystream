import { flags } from '@oclif/command'
import IncentivesCommandBase, { StorageBucketData } from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'

interface StorageMaintenanceScore {
  dynamic_configuration_score: number,
  existing_bag_configuration_score: number,
  excess_capacity_objects_false: number,
  excess_capacity_size_false: number,
  excess_capacity_objects_true: number,
  excess_capacity_size_true: number,
}



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
      description: 'Latest version of colossus, eg "2.0.0"',
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
        const version = await this.getColossusData(endpointUrl,"version")
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
    this.log(`  - ${notLatest.length} nodes running OTHER versions`)
    this.log(`  - ${notReached.length} nodes were either not up, or not displaying the version`)
    console.log("workerData",JSON.stringify(workerData,null,4))
    const newBagIds:string[] = []
    const newChannels = await this.getQNApi().channelsCreatedBetweenBlocks(startBlock,endBlock)
    for (let channel of newChannels) {
      newBagIds.push(`dynamic:channel:${channel}`)
    }
    const storageData = await this.getQNApi().storageBagStorageReplication()
    const bagsUnderTreshold:[string,number][] = []
    let excessReplicationBags = 0
    let existing_bag_configuration_score = 1
    for (let bag of storageData) {
      if (bag.storageBuckets.length >= excessReplication) {
        console.log("excessReplication",bag.id)
        excessReplicationBags ++
      } else {

      }
      if (bag.storageBuckets.length <= minReplication && !bagsToIgnore.includes(bag.id)) {
        console.log("bag.id, bag.storageBuckets",bag.id, bag.storageBuckets)
        existing_bag_configuration_score = 0
        bagsUnderTreshold.push([bag.id,bag.storageBuckets.length])
      }
    }
    console.log("New Bags",newBagIds.length)
    console.log("excessReplicationBags",excessReplicationBags)
    this.log(`Out of ${storageData.length} bags, ${bagsUnderTreshold.length} are in fewer than ${minReplication} buckets`)
    this.log(`existing_bag_configuration_score = ${existing_bag_configuration_score}`)

    const result: StorageMaintenanceScore = {
      dynamic_configuration_score,
      existing_bag_configuration_score,
      excess_capacity_objects_false: 10**100,
      excess_capacity_size_false: 10**100,
      excess_capacity_objects_true: 10**100,
      excess_capacity_size_true: 10**100,
    }
    const storageNodeBuckets = await this.getQNApi().storageBucketsData()
    for (let bucket of storageNodeBuckets) {
      const object = parseInt(bucket.dataObjectCountLimit)-parseInt(bucket.dataObjectsCount)
      const size = parseInt(bucket.dataObjectsSizeLimit.substring(0, bucket.dataObjectsSizeLimit.length - 9))-parseInt(bucket.dataObjectsSize.substring(0, bucket.dataObjectsSize.length - 9))
      if (bucket.acceptingNewBags.toString() == "false") {
        if (object<result.excess_capacity_objects_false) {
          result.excess_capacity_objects_false = object
        }
        if (size<result.excess_capacity_size_false) {
          result.excess_capacity_size_false = size
        }
      } else if (bucket.acceptingNewBags.toString() == "true") {
        if (object<result.excess_capacity_objects_true) {
          result.excess_capacity_objects_true = object
        }
        if (size<result.excess_capacity_size_true) {
          result.excess_capacity_size_true = size
        }
      }
    }
    this.log(result)
  }
}