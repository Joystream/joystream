import { Args, ArgsType, Field, ID, Mutation, Query, Resolver } from 'type-graphql'
import { VideoViewsInfo, VideoViewsInfoModel } from '../entities/VideoViewsInfo'

@ArgsType()
class VideoViewsArgs {
  @Field(() => ID)
  videoID: string
}

@ArgsType()
class BatchedVideoViewsArgs {
  @Field(() => [ID])
  videoIDList: string[]
}

@ArgsType()
class AddVideoViewArgs {
  @Field(() => ID)
  videoID: string
}

@Resolver()
export class VideoViewsInfosResolver {
  @Query(() => VideoViewsInfo, { nullable: true, description: 'Get views count for a single video' })
  async videoViews(@Args() { videoID }: VideoViewsArgs) {
    return VideoViewsInfoModel.findOne({ videoID: videoID })
  }

  @Query(() => [VideoViewsInfo], { description: 'Get views counts for a list of videos', nullable: 'items' })
  async batchedVideoViews(@Args() { videoIDList }: BatchedVideoViewsArgs) {
    const results = await VideoViewsInfoModel.find({
      videoID: {
        $in: videoIDList,
      },
    })

    const resultsLookup = results.reduce((acc, result) => {
      acc[result.videoID] = result
      return acc
    }, {} as Record<string, VideoViewsInfo>)

    return videoIDList.map((id) => resultsLookup[id] || null)
  }

  @Mutation(() => VideoViewsInfo, { description: "Add a single view to the target video's count" })
  async addVideoView(@Args() { videoID }: AddVideoViewArgs) {
    return VideoViewsInfoModel.findOneAndUpdate({ videoID }, { $inc: { views: 1 } }, { new: true, upsert: true })
  }
}
