import { ObjectType, Field, Float, Int, Arg, Args, InputType, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Fields, StandardDeleteResponse, UserId, PaginationArgs, FloatField } from 'warthog';
import { Membership } from '../membership/membership.model';
import FTSService from './fts.service';

@ObjectType()
export class FTSOutput {
    @Field(type => SearchItem)
    item!: typeof SearchItem;

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string
}

export const SearchItem = createUnionType({
    name: "SearchResult",
    types: () => [Membership],
});

@InputType() 
export class FTSInput {
    @Field(() => String)
    text!: string;

    @Field(() => Int)
    limit?: number
}


@Resolver()
export default class FullTextSearchResolver {

    constructor(@Inject('FTSService') readonly service: FTSService) {}

    @Query(() => [FTSOutput])
    async handles(
        @Arg('text') query: string, 
        @Arg('limit') limit: number):Promise<Array<FTSOutput>>{
        
        return this.service.search(query, limit);
    }

}