import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';
import { TitlesFTSService } from './titles.service';

@ObjectType()
export class TitlesFTSOutput {
    @Field(type => TitlesSearchItem)
    item!: typeof TitlesSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const TitlesSearchItem = createUnionType({
    name: "TitlesSearchResult",
    types: () => [
        Channel,
        Video,
    ],
});


@Resolver()
export default class TitlesFTSResolver {

    constructor(@Inject('TitlesFTSService') readonly service: TitlesFTSService) {}

    @Query(() => [TitlesFTSOutput])
    async titles(
        @Arg('text') query: string, 
        @Arg('limit', () => Int, { defaultValue: 5 }) limit: number):Promise<Array<TitlesFTSOutput>>{
        
        return this.service.search(query, limit);
    }

}