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
  CuratorGroupCreateInput,
  CuratorGroupCreateManyArgs,
  CuratorGroupUpdateArgs,
  CuratorGroupWhereArgs,
  CuratorGroupWhereInput,
  CuratorGroupWhereUniqueInput,
  CuratorGroupOrderByEnum,
} from '../../../generated';

import { CuratorGroup } from './curator-group.model';
import { CuratorGroupService } from './curator-group.service';

import { Channel } from '../channel/channel.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class CuratorGroupEdge {
  @Field(() => CuratorGroup, { nullable: false })
  node!: CuratorGroup;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class CuratorGroupConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [CuratorGroupEdge], { nullable: false })
  edges!: CuratorGroupEdge[];

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
export class CuratorGroupConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => CuratorGroupWhereInput, { nullable: true })
  where?: CuratorGroupWhereInput;

  @Field(() => CuratorGroupOrderByEnum, { nullable: true })
  orderBy?: CuratorGroupOrderByEnum;
}

@Resolver(CuratorGroup)
export class CuratorGroupResolver {
  constructor(@Inject('CuratorGroupService') public readonly service: CuratorGroupService) {}

  @Query(() => [CuratorGroup])
  async curatorGroups(
    @Args() { where, orderBy, limit, offset }: CuratorGroupWhereArgs,
    @Fields() fields: string[]
  ): Promise<CuratorGroup[]> {
    return this.service.find<CuratorGroupWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => CuratorGroup, { nullable: true })
  async curatorGroupByUniqueInput(
    @Arg('where') where: CuratorGroupWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<CuratorGroup | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => CuratorGroupConnection)
  async curatorGroupsConnection(
    @Args() { where, orderBy, ...pageOptions }: CuratorGroupConnectionWhereArgs,
    @Info() info: any
  ): Promise<CuratorGroupConnection> {
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
      result = await this.service.findConnection<CuratorGroupWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<CuratorGroupConnection>;
  }

  @FieldResolver(() => Channel)
  async channels(@Root() r: CuratorGroup): Promise<Channel[] | null> {
    const result = await getConnection()
      .getRepository(CuratorGroup)
      .findOne(r.id, { relations: ['channels'] });
    if (result && result.channels !== undefined) {
      return result.channels;
    }
    return null;
  }
}
