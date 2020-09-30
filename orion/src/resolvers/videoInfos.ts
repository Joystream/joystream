import { Args, ArgsType, Field, ID, Mutation, Query, Resolver } from 'type-graphql'
import { VideoInfo, VideoInfoModel } from '../entities/VideoInfo'

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
export class VideoInfosResolver {
  @Query(() => VideoInfo, { nullable: true })
  async videoViews(@Args() { videoID }: VideoViewsArgs) {
    return VideoInfoModel.findOne({ videoID: videoID })
  }

  @Query(() => [VideoInfo])
  async batchedVideoViews(@Args() { videoIDList }: BatchedVideoViewsArgs) {
    return VideoInfoModel.find({
      'videoID': {
        $in: videoIDList,
      },
    })
  }

  @Mutation(() => VideoInfo)
  async addVideoView(@Args() { videoID }: AddVideoViewArgs) {
    return VideoInfoModel.findOneAndUpdate({ videoID: videoID }, { $inc: { views: 1 } }, { new: true, upsert: true })
  }
}
