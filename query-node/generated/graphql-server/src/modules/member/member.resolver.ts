import {
  Arg,
  Args,
  Mutation,
  Query,
  Root,
  Resolver,
  FieldResolver,
  ObjectType,
  Field,
  Int,
  ArgsType,
} from 'type-graphql';
import { Inject } from 'typedi';
import { Min } from 'class-validator';
import { Fields, StandardDeleteResponse, UserId, PageInfo, RawFields } from 'warthog';

import {
  MemberCreateInput,
  MemberCreateManyArgs,
  MemberUpdateArgs,
  MemberWhereArgs,
  MemberWhereInput,
  MemberWhereUniqueInput,
  MemberOrderByEnum,
} from '../../../generated';

import { Member } from './member.model';
import { MemberService } from './member.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class MemberEdge {
  @Field(() => Member, { nullable: false })
  node!: Member;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class MemberConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [MemberEdge], { nullable: false })
  edges!: MemberEdge[];

  @Field(() => PageInfo, { nullable: false })
  pageInfo!: PageInfo;
}

@ArgsType()
export class ConnectionPageInputOptions {
  @Field(() => Int, { nullable: true })
  @Min(0)
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string; // V3: TODO: should we make a RelayCursor scalar?

  @Field(() => Int, { nullable: true })
  @Min(0)
  last?: number;

  @Field(() => String, { nullable: true })
  before?: string;
}

@ArgsType()
export class MemberConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => MemberWhereInput, { nullable: true })
  where?: MemberWhereInput;

  @Field(() => MemberOrderByEnum, { nullable: true })
  orderBy?: MemberOrderByEnum;
}

@Resolver(Member)
export class MemberResolver {
  constructor(@Inject('MemberService') public readonly service: MemberService) {}

  @Query(() => [Member])
  async members(
    @Args() { where, orderBy, limit, offset }: MemberWhereArgs,
    @Fields() fields: string[]
  ): Promise<Member[]> {
    return this.service.find<MemberWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => MemberConnection)
  async memberConnection(
    @Args() { where, orderBy, ...pageOptions }: MemberConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<MemberConnection> {
    let result: any = {
      totalCount: 0,
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    // If the related database table does not have any records then an error is thrown to the client
    // by warthog
    try {
      result = await this.service.findConnection<MemberWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<MemberConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: Member): Promise<Block> {
    const result = await getConnection()
      .getRepository(Member)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for Member.happenedIn');
    }
    return result.happenedIn;
  }
}
