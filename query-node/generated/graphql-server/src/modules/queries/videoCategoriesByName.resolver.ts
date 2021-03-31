import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { VideoCategory } from '../video-category/video-category.model';
import { VideoCategoriesByNameFTSService } from './videoCategoriesByName.service';

import {  VideoCategoryWhereInput,  } from '../../../generated';

@ObjectType()
export class VideoCategoriesByNameFTSOutput {
    @Field(type => VideoCategoriesByNameSearchItem)
    item!: typeof VideoCategoriesByNameSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const VideoCategoriesByNameSearchItem = createUnionType({
    name: "VideoCategoriesByNameSearchResult",
    types: () => [
        VideoCategory,
    ],
});


@Resolver()
export default class VideoCategoriesByNameFTSResolver {

    constructor(@Inject('VideoCategoriesByNameFTSService') readonly service: VideoCategoriesByNameFTSService) {}

    @Query(() => [VideoCategoriesByNameFTSOutput])
    async videoCategoriesByName(
      @Arg('text') query: string, 
      @Arg('limit', () => Int, { defaultValue: 5 }) limit: number,
      @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
      @Arg('whereVideoCategory', { nullable: true }) whereVideoCategory?: VideoCategoryWhereInput,
    ):Promise<Array<VideoCategoriesByNameFTSOutput>>{
      return this.service.search(query, limit, skip, whereVideoCategory,);
    }

}