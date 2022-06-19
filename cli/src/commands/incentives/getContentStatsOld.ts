
import { flags } from '@oclif/command'
import { AllChannelsFieldsFragment, AllVideosFieldsFragment } from 'src/graphql/generated/queries'
import IncentivesCommandBase from '../../base/IncentivesCommandBase'
//import chalk from 'chalk'


export default class GetContentInfo extends IncentivesCommandBase {
  static description = 'Gets stats'

  static flags = {
    startBlock: flags.integer({
      required: true,
      description: 'The blockheight of the start first scoring period, eg. 43200',
    }),
    startBlockTimestamp: flags.integer({
      required: false,
      description: 'The timestamp of the first block [ms]',
    }),
    endBlock: flags.integer({
      required: true,
      description: 'The blockheight where the last period ended',
    }),
    endBlockTimestamp: flags.integer({
      required: false,
      description: 'The timestamp of the last block [ms]',
    }),
    videosCensored: flags.string({
      required: false,
      description: 'Videos that was censored as of last period, eg. --videosCensored=1,4,111',
    }),
    channelsCensored: flags.string({
      required: false,
      description: 'Channels that was censored as of last period, eg. --channelsCensored=1,4,111',
    }),
    ...IncentivesCommandBase.flags,
  }

  async run(): Promise<void> {
    let { startBlock,endBlock,videosCensored,channelsCensored,startBlockTimestamp,endBlockTimestamp } = this.parse(GetContentInfo).flags
    
    let startDateTime = await this.getTimestamps(startBlock)
    let endDateTime = await this.getTimestamps(endBlock)
    if ( startBlockTimestamp && endBlockTimestamp) {
      startDateTime = new Date(startBlockTimestamp)
      endDateTime = new Date(endBlockTimestamp)
    }


    const oldVideosCensored: number[] = []
    const newVideosCensored: AllVideosFieldsFragment[] = []
    const allVideosCensored: AllVideosFieldsFragment[] = []
    
    const oldChannelsCensored: number[] = []
    const newChannelsCensored: AllVideosFieldsFragment[] = []
    const allChannelsCensored: AllVideosFieldsFragment[] = []
    
    const channelsUncensored: number[] = []
    const videosUncensored: number[] = []

    const newVideos: [number,number][] = []
    const newChannels: [number,number][] = []

    const videosWithMissingAssetsOrMetadata: number[] = []
    const newVideosWithMissingAssetsOrMetadata: AllVideosFieldsFragment[] = []
    
    const channelsWithMissingAssetsOrMetadata: number[] = []
    const newChannelsWithMissingAssetsOrMetadata: AllChannelsFieldsFragment[] = []



    if (videosCensored) {
      videosCensored.split(",").forEach((a) => {
        oldVideosCensored.push(parseInt(a))
      })
    }

    if (channelsCensored) {
      channelsCensored.split(",").forEach((a) => {
        oldChannelsCensored.push(parseInt(a))
      })
    }

    const allVideos = await this.getQNApi().allVideos()
    const allChannels = await this.getQNApi().allChannels()


    for (let video of allVideos) {
      const id = parseInt(video.id)
      if (video.createdInBlock > startBlock && video.createdInBlock < endBlock) {
        newVideos.push([id,video.createdInBlock])
        if (video.nftId && video.nftId !== null) {
          console.log("new NFT:", video.id,video.nftId)
        }
      }
      if (video.isCensored) {
        allVideosCensored.push(video)
        const timeStampCreated = new Date(video.createdAt)
        const timeStampUpdated = new Date(video.updatedAt)
        const censoredAfter = Math.abs(timeStampUpdated.getTime() - timeStampCreated.getTime())
        //console.log(id)
        //console.log("timeStampUpdated.getTime() > startDateTime && timeStampUpdated.getTime() < endDateTime",timeStampUpdated.getTime() > startDateTime, timeStampUpdated.getTime() < endDateTime)
        //console.log("timeStampUpdated.getTime(), startDateTime, endDateTime",timeStampUpdated.getTime(), startDateTime, endDateTime)
        if (timeStampUpdated.getTime() > startDateTime.getTime() && timeStampUpdated.getTime() < endDateTime.getTime()) {
          newVideosCensored.push(video)
          if (censoredAfter/1000 < 86400) {
            console.log("good censor", censoredAfter, id)
          } else {
            console.log("bad censor", censoredAfter, id)
          }
        }
      }
      if (!video.media?.isAccepted || !video.thumbnailPhoto?.isAccepted) {
        videosWithMissingAssetsOrMetadata.push(id)
        if (video.createdInBlock > startBlock && video.createdInBlock < endBlock) {
          newVideosWithMissingAssetsOrMetadata.push(video)
        }
      }
      oldVideosCensored.forEach((a) => {
        if (a == id) {
          if (!video.isCensored) {
            videosUncensored.push(a)
          }
        }
      })
    }

    for (let channel of allChannels) {
      const id = parseInt(channel.id)
      if (channel.createdInBlock > startBlock && channel.createdInBlock < endBlock) {
        newChannels.push([id,channel.createdInBlock])
      }
      if (channel.isCensored) {
        const timeStampCreated = new Date(channel.createdAt)
        const timeStampUpdated = new Date(channel.updatedAt)
        const censoredAfter = Math.abs(timeStampUpdated.getTime() - timeStampCreated.getTime())
        console.log(censoredAfter)
        //console.log(id)
        //console.log("timeStampUpdated.getTime() > startDateTime && timeStampUpdated.getTime() < endDateTime",timeStampUpdated.getTime() > startDateTime, timeStampUpdated.getTime() < endDateTime)
        //console.log("timeStampUpdated.getTime(), startDateTime, endDateTime",timeStampUpdated.getTime(), startDateTime, endDateTime)
        allChannelsCensored.push(channel)
        if (timeStampUpdated.getTime() > startDateTime.getTime() && timeStampUpdated.getTime() < endDateTime.getTime()) {
          newChannelsCensored.push(channel)
          if (censoredAfter/1000 < 86400) {
            console.log("good censor", censoredAfter, id)
          } else {
            console.log("bad censor", censoredAfter, id)
          }
        }
      }
      if (!channel.avatarPhoto?.isAccepted || !channel.coverPhoto?.isAccepted) {
        channelsWithMissingAssetsOrMetadata.push(id)
        if (channel.createdInBlock > startBlock && channel.createdInBlock < endBlock) {
          newChannelsWithMissingAssetsOrMetadata.push(channel)
        }
      }
      oldChannelsCensored.forEach((a) => {
        if (a == id) {
          if (!channel.isCensored) {
            channelsUncensored.push(a)
          }
        }
      })
    }

    console.log("oldVideosCensored)",oldVideosCensored.length,oldVideosCensored)
    
    console.log("oldChannelsCensored)",oldChannelsCensored.length,oldChannelsCensored)
    
    console.log("channelsUncensored)",channelsUncensored.length,channelsUncensored)
    console.log("videosUncensored)",videosUncensored.length,videosUncensored)
    
    console.log("newVideos)",newVideos.length,newVideos)
    console.log("newChannels)",newChannels.length,newChannels)
    
    console.log("videosWithMissingAssetsOrMetadata)",videosWithMissingAssetsOrMetadata.length,videosWithMissingAssetsOrMetadata)
    
    console.log("channelsWithMissingAssetsOrMetadata)",channelsWithMissingAssetsOrMetadata.length,channelsWithMissingAssetsOrMetadata)
    
    console.log(`newVideosCensored`,newVideosCensored.length,JSON.stringify(newVideosCensored, null, 4))
    console.log(`newVideosWithMissingAssetsOrMetadata`,newVideosWithMissingAssetsOrMetadata.length,JSON.stringify(newVideosWithMissingAssetsOrMetadata, null, 4))
    
    console.log(`newChannelsCensored`,newChannelsCensored.length,JSON.stringify(newChannelsCensored, null, 4))
    console.log(`newChannelsWithMissingAssetsOrMetadata`,newChannelsWithMissingAssetsOrMetadata.length,JSON.stringify(newChannelsWithMissingAssetsOrMetadata, null, 4))

    console.log(`allVideosCensored`,allVideosCensored.length,JSON.stringify(allVideosCensored, null, 4))
    console.log(`allChannelsCensored`,allChannelsCensored.length,JSON.stringify(allChannelsCensored, null, 4))
  }
}