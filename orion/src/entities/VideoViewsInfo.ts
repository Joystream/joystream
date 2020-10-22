import { Field, ID, Int, ObjectType } from 'type-graphql'
import { getModelForClass, prop } from '@typegoose/typegoose'

@ObjectType()
export class VideoViewsInfo {
  @Field(() => ID, { name: 'id' })
  @prop({ required: true, index: true })
  videoID: string

  @Field(() => Int)
  @prop({ required: true, default: 0 })
  views: number
}

export const VideoViewsInfoModel = getModelForClass(VideoViewsInfo)
