import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { ChannelCategory } from '../channel-category/channel-category.model';
import { ChannelCategoriesByNameFTSService } from './channelCategoriesByName.service';

import {  ChannelCategoryWhereInput,  } from '../../../generated';

@ObjectType()
export class ChannelCategoriesByNameFTSOutput {
    @Field(type => ChannelCategoriesByNameSearchItem)
    item!: typeof ChannelCategoriesByNameSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const ChannelCategoriesByNameSearchItem = createUnionType({
    name: "ChannelCategoriesByNameSearchResult",
    types: () => [
        ChannelCategory,
    ],
});


@Resolver()
export default class ChannelCategoriesByNameFTSResolver {

    constructor(@Inject('ChannelCategoriesByNameFTSService') readonly service: ChannelCategoriesByNameFTSService) {}

    @Query(() => [ChannelCategoriesByNameFTSOutput])
    async channelCategoriesByName(
      @Arg('text') query: string, 
      @Arg('limit', () => Int, { defaultValue: 5 }) limit: number,
      @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
      @Arg('whereChannelCategory', { nullable: true }) whereChannelCategory?: ChannelCategoryWhereInput,
    ):Promise<Array<ChannelCategoriesByNameFTSOutput>>{
      return this.service.search(query, limit, skip, whereChannelCategory,);
    }

}