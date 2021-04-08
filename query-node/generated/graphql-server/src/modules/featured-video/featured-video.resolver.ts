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
  FeaturedVideoCreateInput,
  FeaturedVideoCreateManyArgs,
  FeaturedVideoUpdateArgs,
  FeaturedVideoWhereArgs,
  FeaturedVideoWhereInput,
  FeaturedVideoWhereUniqueInput,
  FeaturedVideoOrderByEnum,
} from '../../../generated';

import { FeaturedVideo } from './featured-video.model';
import { FeaturedVideoService } from './featured-video.service';

import { Video } from '../video/video.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class FeaturedVideoEdge {
  @Field(() => FeaturedVideo, { nullable: false })
  node!: FeaturedVideo;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class FeaturedVideoConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [FeaturedVideoEdge], { nullable: false })
  edges!: FeaturedVideoEdge[];

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
export class FeaturedVideoConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => FeaturedVideoWhereInput, { nullable: true })
  where?: FeaturedVideoWhereInput;

  @Field(() => FeaturedVideoOrderByEnum, { nullable: true })
  orderBy?: FeaturedVideoOrderByEnum;
}

@Resolver(FeaturedVideo)
export class FeaturedVideoResolver {
  constructor(@Inject('FeaturedVideoService') public readonly service: FeaturedVideoService) {}

  @Query(() => [FeaturedVideo])
  async featuredVideos(
    @Args() { where, orderBy, limit, offset }: FeaturedVideoWhereArgs,
    @Fields() fields: string[]
  ): Promise<FeaturedVideo[]> {
    return this.service.find<FeaturedVideoWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => FeaturedVideo, { nullable: true })
  async featuredVideoByUniqueInput(
    @Arg('where') where: FeaturedVideoWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<FeaturedVideo | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => FeaturedVideoConnection)
  async featuredVideosConnection(
    @Args() { where, orderBy, ...pageOptions }: FeaturedVideoConnectionWhereArgs,
    @Info() info: any
  ): Promise<FeaturedVideoConnection> {
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
      result = await this.service.findConnection<FeaturedVideoWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<FeaturedVideoConnection>;
  }

  @FieldResolver(() => Video)
  async video(@Root() r: FeaturedVideo): Promise<Video | null> {
    const result = await getConnection()
      .getRepository(FeaturedVideo)
      .findOne(r.id, { relations: ['video'] });
    if (result && result.video !== undefined) {
      return result.video;
    }
    return null;
  }
}
