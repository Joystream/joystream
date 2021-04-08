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
  ChannelCategoryCreateInput,
  ChannelCategoryCreateManyArgs,
  ChannelCategoryUpdateArgs,
  ChannelCategoryWhereArgs,
  ChannelCategoryWhereInput,
  ChannelCategoryWhereUniqueInput,
  ChannelCategoryOrderByEnum,
} from '../../../generated';

import { ChannelCategory } from './channel-category.model';
import { ChannelCategoryService } from './channel-category.service';

import { Channel } from '../channel/channel.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class ChannelCategoryEdge {
  @Field(() => ChannelCategory, { nullable: false })
  node!: ChannelCategory;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class ChannelCategoryConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [ChannelCategoryEdge], { nullable: false })
  edges!: ChannelCategoryEdge[];

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
export class ChannelCategoryConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => ChannelCategoryWhereInput, { nullable: true })
  where?: ChannelCategoryWhereInput;

  @Field(() => ChannelCategoryOrderByEnum, { nullable: true })
  orderBy?: ChannelCategoryOrderByEnum;
}

@Resolver(ChannelCategory)
export class ChannelCategoryResolver {
  constructor(@Inject('ChannelCategoryService') public readonly service: ChannelCategoryService) {}

  @Query(() => [ChannelCategory])
  async channelCategories(
    @Args() { where, orderBy, limit, offset }: ChannelCategoryWhereArgs,
    @Fields() fields: string[]
  ): Promise<ChannelCategory[]> {
    return this.service.find<ChannelCategoryWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => ChannelCategory, { nullable: true })
  async channelCategoryByUniqueInput(
    @Arg('where') where: ChannelCategoryWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<ChannelCategory | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => ChannelCategoryConnection)
  async channelCategoriesConnection(
    @Args() { where, orderBy, ...pageOptions }: ChannelCategoryConnectionWhereArgs,
    @Info() info: any
  ): Promise<ChannelCategoryConnection> {
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
      result = await this.service.findConnection<ChannelCategoryWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<ChannelCategoryConnection>;
  }

  @FieldResolver(() => Channel)
  async channels(@Root() r: ChannelCategory): Promise<Channel[] | null> {
    const result = await getConnection()
      .getRepository(ChannelCategory)
      .findOne(r.id, { relations: ['channels'] });
    if (result && result.channels !== undefined) {
      return result.channels;
    }
    return null;
  }
}
