import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Member } from '../member/member.model';
import { HandlesFTSService } from './handles.service';

@ObjectType()
export class HandlesFTSOutput {
    @Field(type => HandlesSearchItem)
    item!: typeof HandlesSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const HandlesSearchItem = createUnionType({
    name: "HandlesSearchResult",
    types: () => [
        Member,
    ],
});


@Resolver()
export default class HandlesFTSResolver {

    constructor(@Inject('HandlesFTSService') readonly service: HandlesFTSService) {}

    @Query(() => [HandlesFTSOutput])
    async handles(
        @Arg('text') query: string, 
        @Arg('limit', () => Int, { defaultValue: 5 }) limit: number):Promise<Array<HandlesFTSOutput>>{
        
        return this.service.search(query, limit);
    }

}