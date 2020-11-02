import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Category } from '../category/category.model';
import { NamesFTSService } from './names.service';

@ObjectType()
export class NamesFTSOutput {
    @Field(type => NamesSearchItem)
    item!: typeof NamesSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const NamesSearchItem = createUnionType({
    name: "NamesSearchResult",
    types: () => [
        Category,
    ],
});


@Resolver()
export default class NamesFTSResolver {

    constructor(@Inject('NamesFTSService') readonly service: NamesFTSService) {}

    @Query(() => [NamesFTSOutput])
    async names(
        @Arg('text') query: string, 
        @Arg('limit', () => Int, { defaultValue: 5 }) limit: number):Promise<Array<NamesFTSOutput>>{
        
        return this.service.search(query, limit);
    }

}