import { flags } from '@oclif/command'
import IncentivesCommandBase from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'

interface FamilyBucketsAndBags {
  family: number,
  buckets: number[],
  operators: number,
  bucketsHolding: number[],
}

interface DistributorsBucketData {
  familyBucketId: number,
  bucketId: number,
  workerId: number,
  isAccepting: boolean,
  isDistributing: boolean,
  endpointUrl: string,
  data: any
}


export default class DistributionStats extends IncentivesCommandBase {
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
    minReplication: flags.integer({
      char: 'm',
      required: true,
      description: 'Minimum required replication',
    }),
    bagsRangeStart: flags.integer({
      char: 's',
      required: true,
      description: 'First bag to include',
    }),
    bagsRangeEnd: flags.integer({
      char: 'e',
      required: true,
      description: 'Last bag to include',
    }),
    latestVersion: flags.string({
      char: 'l',
      required: true,
      description: 'Latest version of colossus, eg -l "0.1.2"',
    }),
    ...IncentivesCommandBase.flags,
  }


  async run(): Promise<void> {
    let { startBlockInput,endBlockInput } = this.parse(DistributionStats).args
    const startBlock = parseInt(startBlockInput)
    const endBlock = parseInt(endBlockInput)
    const { minReplication,bagsRangeStart,bagsRangeEnd,latestVersion } = this.parse(DistributionStats).flags

    const bags: string[] = []
    const bagIds: number[] = []
    for (let i=bagsRangeStart; i<bagsRangeEnd+1; i++) {
      bags.push(`dynamic:channel:${i}`)
      bagIds.push(i)
    }

    let startDateTime = await this.getTimestamps(startBlock)
    let endDateTime = await this.getTimestamps(endBlock)
    console.log("startDateTime,endDateTime",startDateTime,endDateTime)

    const distributionBucketsData = await this.getQNApi().distributionBucketsData()
    for (let bucket of distributionBucketsData) {
      console.log("bucket.id, bucket.acceptingNewBags",bucket.id, bucket.acceptingNewBags)
    }

    const bagsOverview: FamilyBucketsAndBags[] = []
    
    const workerData: DistributorsBucketData[] = []
    const latest:[number,string,string][] = []
    const notLatest:[number,string,string][] = []
    const notReached:[number,string,string][] = []
    const distributionBucketFamilyData = await this.getQNApi().distributionBucketFamilyData()
    for (let family of distributionBucketFamilyData) {
      const bucketsHolding:number[] = []
      for (let i=0; i<bags.length;i++) {
        bucketsHolding.push(0)
      }
      const a: FamilyBucketsAndBags = {
        family: parseInt(family.id),
        buckets: [],
        operators: 0,
        bucketsHolding,
      }
      for (let bucket of family.buckets) {
        a.buckets.push(bucket.bucketIndex)
        for (let i=0; i<bucket.operators.length; i++) {
          let endpointUrl = bucket.operators[i].metadata?.nodeEndpoint ?? undefined
          if (endpointUrl) {
          } else {
            endpointUrl = "not set"
          }
          if (bucket.operators[i].metadata) {
            const data = await this.getArgusData(endpointUrl)
            const bucketData: DistributorsBucketData = {
              familyBucketId: parseInt(family.id),
              bucketId: parseInt(bucket.id),
              workerId: bucket.operators[i].workerId,
              isAccepting: bucket.acceptingNewBags,
              isDistributing: bucket.distributing,
              endpointUrl,
              data,
            }
            console.log("bucketData.data",bucketData.data)
            console.log("version",bucketData.data.version)
            console.log("versionversion",bucketData.data.version.version)
            workerData.push(bucketData)
            let version = bucketData.data.version
            if (version == latestVersion) {
              latest.push([bucket.operators[i].workerId,endpointUrl,version])
            } else if (version == "not reachable") {
              notReached.push([bucket.operators[i].workerId,endpointUrl,version])
            } else {
              notLatest.push([bucket.operators[i].workerId,endpointUrl,version])
            }
          }
        }
        for (let n=0; n<bucket.bags.length; n++) {
          const bagId = bucket.bags[n].id
          const bagIndex = bags.indexOf(bagId)
          bucketsHolding[bagIndex]++
        }
      }
      let underReplicated = 0
      for (let bags of a.bucketsHolding) {
        if (bags < minReplication) {
          underReplicated ++
        }
      }
      console.log("a",a.family,a.buckets.length)
      console.log("underReplicated",underReplicated)
      bagsOverview.push(a)
    }
    this.log(`For the workers at block ${endBlockInput}, there were:`)
    this.log(`  - ${latest.length} nodes running version ${latestVersion}`)
    this.log(`  - ${notReached.length} nodes were either not up, or not displaying the version`)
    this.log(`  - ${notLatest.length} nodes running OTHER versions`)
    console.log(JSON.stringify(bagsOverview,null,4))
    console.log(JSON.stringify(workerData,null,4))
  }
}