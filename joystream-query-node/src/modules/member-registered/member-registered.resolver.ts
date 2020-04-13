import { Arg, Args, Mutation, Query, Resolver } from 'type-graphql';
import { Inject } from 'typedi';
import { Fields, StandardDeleteResponse, UserId } from 'warthog';

import {
  MemberRegisteredCreateInput,
  MemberRegisteredCreateManyArgs,
  MemberRegisteredUpdateArgs,
  MemberRegisteredWhereArgs,
  MemberRegisteredWhereInput,
  MemberRegisteredWhereUniqueInput
} from '../../../generated';

import { MemberRegistered } from './member-registered.model';
import { MemberRegisteredService } from './member-registered.service';

@Resolver(MemberRegistered)
export class MemberRegisteredResolver {
  constructor(
    @Inject('MemberRegisteredService') public readonly service: MemberRegisteredService
  ) {}

  @Query(() => [MemberRegistered])
  async memberRegistereds(
    @Args() { where, orderBy, limit, offset }: MemberRegisteredWhereArgs,
    @Fields() fields: string[]
  ): Promise<MemberRegistered[]> {
    return this.service.find<MemberRegisteredWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => MemberRegistered)
  async memberRegistered(
    @Arg('where') where: MemberRegisteredWhereUniqueInput
  ): Promise<MemberRegistered> {
    return this.service.findOne<MemberRegisteredWhereUniqueInput>(where);
  }

  @Mutation(() => MemberRegistered)
  async createMemberRegistered(
    @Arg('data') data: MemberRegisteredCreateInput,
    @UserId() userId: string
  ): Promise<MemberRegistered> {
    return this.service.create(data, userId);
  }

  @Mutation(() => [MemberRegistered])
  async createManyMemberRegistereds(
    @Args() { data }: MemberRegisteredCreateManyArgs,
    @UserId() userId: string
  ): Promise<MemberRegistered[]> {
    return this.service.createMany(data, userId);
  }

  @Mutation(() => MemberRegistered)
  async updateMemberRegistered(
    @Args() { data, where }: MemberRegisteredUpdateArgs,
    @UserId() userId: string
  ): Promise<MemberRegistered> {
    return this.service.update(data, where, userId);
  }

  @Mutation(() => StandardDeleteResponse)
  async deleteMemberRegistered(
    @Arg('where') where: MemberRegisteredWhereUniqueInput,
    @UserId() userId: string
  ): Promise<StandardDeleteResponse> {
    return this.service.delete(where, userId);
  }
}
