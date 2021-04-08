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
  Info,
} from 'type-graphql';
import graphqlFields from 'graphql-fields';
import { Inject } from 'typedi';
import { Min } from 'class-validator';
import { Fields, StandardDeleteResponse, UserId, PageInfo, RawFields } from 'warthog';

import {
  MembershipCreateInput,
  MembershipCreateManyArgs,
  MembershipUpdateArgs,
  MembershipWhereArgs,
  MembershipWhereInput,
  MembershipWhereUniqueInput,
  MembershipOrderByEnum,
} from '../../../generated';

import { Membership } from './membership.model';
import { MembershipService } from './membership.service';

import { Channel } from '../channel/channel.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class MembershipEdge {
  @Field(() => Membership, { nullable: false })
  node!: Membership;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class MembershipConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [MembershipEdge], { nullable: false })
  edges!: MembershipEdge[];

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
export class MembershipConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => MembershipWhereInput, { nullable: true })
  where?: MembershipWhereInput;

  @Field(() => MembershipOrderByEnum, { nullable: true })
  orderBy?: MembershipOrderByEnum;
}

@Resolver(Membership)
export class MembershipResolver {
  constructor(@Inject('MembershipService') public readonly service: MembershipService) {}

  @Query(() => [Membership])
  async memberships(
    @Args() { where, orderBy, limit, offset }: MembershipWhereArgs,
    @Fields() fields: string[]
  ): Promise<Membership[]> {
    return this.service.find<MembershipWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => Membership, { nullable: true })
  async membershipByUniqueInput(
    @Arg('where') where: MembershipWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<Membership | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => MembershipConnection)
  async membershipsConnection(
    @Args() { where, orderBy, ...pageOptions }: MembershipConnectionWhereArgs,
    @Info() info: any
  ): Promise<MembershipConnection> {
    const rawFields = graphqlFields(info, {}, { excludedFields: ['__typename'] });

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
      result = await this.service.findConnection<MembershipWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<MembershipConnection>;
  }

  @FieldResolver(() => Channel)
  async channels(@Root() r: Membership): Promise<Channel[] | null> {
    const result = await getConnection()
      .getRepository(Membership)
      .findOne(r.id, { relations: ['channels'] });
    if (result && result.channels !== undefined) {
      return result.channels;
    }
    return null;
  }
}
