import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';
import { SearchFTSService } from './search.service';

import {  ChannelWhereInput,  VideoWhereInput,  } from '../../../generated';

@ObjectType()
export class SearchFTSOutput {
    @Field(type => SearchSearchItem)
    item!: typeof SearchSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const SearchSearchItem = createUnionType({
    name: "SearchSearchResult",
    types: () => [
        Channel,
        Video,
    ],
});


@Resolver()
export default class SearchFTSResolver {

    constructor(@Inject('SearchFTSService') readonly service: SearchFTSService) {}

    @Query(() => [SearchFTSOutput])
    async search(
      @Arg('text') query: string, 
      @Arg('limit', () => Int, { defaultValue: 5 }) limit: number,
      @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
      @Arg('whereChannel', { nullable: true }) whereChannel?: ChannelWhereInput,
      @Arg('whereVideo', { nullable: true }) whereVideo?: VideoWhereInput,
    ):Promise<Array<SearchFTSOutput>>{
      return this.service.search(query, limit, skip, whereChannel,whereVideo,);
    }

}