import { ObjectType, Field, Float, Int, Arg, Query, Resolver, createUnionType } from 'type-graphql';
import { Inject } from 'typedi';
import { Membership } from '../membership/membership.model';
import { MembersByHandleFTSService } from './membersByHandle.service';

import {  MembershipWhereInput,  } from '../../../generated';

@ObjectType()
export class MembersByHandleFTSOutput {
    @Field(type => MembersByHandleSearchItem)
    item!: typeof MembersByHandleSearchItem

    @Field(type => Float)
    rank!: number

    @Field(type => String)
    isTypeOf!: string

    @Field(type => String)
    highlight!: string
}

export const MembersByHandleSearchItem = createUnionType({
    name: "MembersByHandleSearchResult",
    types: () => [
        Membership,
    ],
});


@Resolver()
export default class MembersByHandleFTSResolver {

    constructor(@Inject('MembersByHandleFTSService') readonly service: MembersByHandleFTSService) {}

    @Query(() => [MembersByHandleFTSOutput])
    async membersByHandle(
      @Arg('text') query: string, 
      @Arg('limit', () => Int, { defaultValue: 5 }) limit: number,
      @Arg('skip', () => Int, { defaultValue: 0 }) skip: number,
      @Arg('whereMembership', { nullable: true }) whereMembership?: MembershipWhereInput,
    ):Promise<Array<MembersByHandleFTSOutput>>{
      return this.service.search(query, limit, skip, whereMembership,);
    }

}