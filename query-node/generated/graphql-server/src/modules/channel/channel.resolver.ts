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
  ChannelCreateInput,
  ChannelCreateManyArgs,
  ChannelUpdateArgs,
  ChannelWhereArgs,
  ChannelWhereInput,
  ChannelWhereUniqueInput,
  ChannelOrderByEnum,
} from '../../../generated';

import { Channel } from './channel.model';
import { ChannelService } from './channel.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class ChannelEdge {
  @Field(() => Channel, { nullable: false })
  node!: Channel;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class ChannelConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [ChannelEdge], { nullable: false })
  edges!: ChannelEdge[];

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
export class ChannelConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => ChannelWhereInput, { nullable: true })
  where?: ChannelWhereInput;

  @Field(() => ChannelOrderByEnum, { nullable: true })
  orderBy?: ChannelOrderByEnum;
}

@Resolver(Channel)
export class ChannelResolver {
  constructor(@Inject('ChannelService') public readonly service: ChannelService) {}

  @Query(() => [Channel])
  async channels(
    @Args() { where, orderBy, limit, offset }: ChannelWhereArgs,
    @Fields() fields: string[]
  ): Promise<Channel[]> {
    return this.service.find<ChannelWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => ChannelConnection)
  async channelConnection(
    @Args() { where, orderBy, ...pageOptions }: ChannelConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<ChannelConnection> {
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
      result = await this.service.findConnection<ChannelWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<ChannelConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: Channel): Promise<Block> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for Channel.happenedIn');
    }
    return result.happenedIn;
  }
}
