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

import { Membership } from '../membership/membership.model';
import { CuratorGroup } from '../curator-group/curator-group.model';
import { ChannelCategory } from '../channel-category/channel-category.model';
import { DataObject } from '../data-object/data-object.model';
import { Language } from '../language/language.model';
import { Video } from '../video/video.model';
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
  orderBy?: [ChannelOrderByEnum];
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

  @Query(() => Channel, { nullable: true })
  async channelByUniqueInput(
    @Arg('where') where: ChannelWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<Channel | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => ChannelConnection)
  async channelsConnection(
    @Args() { where, orderBy, ...pageOptions }: ChannelConnectionWhereArgs,
    @Info() info: any
  ): Promise<ChannelConnection> {
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
      result = await this.service.findConnection<ChannelWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<ChannelConnection>;
  }

  @FieldResolver(() => Membership)
  async ownerMember(@Root() r: Channel): Promise<Membership | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['ownerMember'] });
    if (result && result.ownerMember !== undefined) {
      return result.ownerMember;
    }
    return null;
  }

  @FieldResolver(() => CuratorGroup)
  async ownerCuratorGroup(@Root() r: Channel): Promise<CuratorGroup | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['ownerCuratorGroup'] });
    if (result && result.ownerCuratorGroup !== undefined) {
      return result.ownerCuratorGroup;
    }
    return null;
  }

  @FieldResolver(() => ChannelCategory)
  async category(@Root() r: Channel): Promise<ChannelCategory | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['category'] });
    if (result && result.category !== undefined) {
      return result.category;
    }
    return null;
  }

  @FieldResolver(() => DataObject)
  async coverPhotoDataObject(@Root() r: Channel): Promise<DataObject | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['coverPhotoDataObject'] });
    if (result && result.coverPhotoDataObject !== undefined) {
      return result.coverPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => DataObject)
  async avatarPhotoDataObject(@Root() r: Channel): Promise<DataObject | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['avatarPhotoDataObject'] });
    if (result && result.avatarPhotoDataObject !== undefined) {
      return result.avatarPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => Language)
  async language(@Root() r: Channel): Promise<Language | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['language'] });
    if (result && result.language !== undefined) {
      return result.language;
    }
    return null;
  }

  @FieldResolver(() => Video)
  async videos(@Root() r: Channel): Promise<Video[] | null> {
    const result = await getConnection()
      .getRepository(Channel)
      .findOne(r.id, { relations: ['videos'] });
    if (result && result.videos !== undefined) {
      return result.videos;
    }
    return null;
  }
}
