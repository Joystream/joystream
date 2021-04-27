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
  VideoCategoryCreateInput,
  VideoCategoryCreateManyArgs,
  VideoCategoryUpdateArgs,
  VideoCategoryWhereArgs,
  VideoCategoryWhereInput,
  VideoCategoryWhereUniqueInput,
  VideoCategoryOrderByEnum,
} from '../../../generated';

import { VideoCategory } from './video-category.model';
import { VideoCategoryService } from './video-category.service';

import { Video } from '../video/video.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class VideoCategoryEdge {
  @Field(() => VideoCategory, { nullable: false })
  node!: VideoCategory;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class VideoCategoryConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [VideoCategoryEdge], { nullable: false })
  edges!: VideoCategoryEdge[];

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
export class VideoCategoryConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => VideoCategoryWhereInput, { nullable: true })
  where?: VideoCategoryWhereInput;

  @Field(() => VideoCategoryOrderByEnum, { nullable: true })
  orderBy?: VideoCategoryOrderByEnum;
}

@Resolver(VideoCategory)
export class VideoCategoryResolver {
  constructor(@Inject('VideoCategoryService') public readonly service: VideoCategoryService) {}

  @Query(() => [VideoCategory])
  async videoCategories(
    @Args() { where, orderBy, limit, offset }: VideoCategoryWhereArgs,
    @Fields() fields: string[]
  ): Promise<VideoCategory[]> {
    return this.service.find<VideoCategoryWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => VideoCategory, { nullable: true })
  async videoCategoryByUniqueInput(
    @Arg('where') where: VideoCategoryWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<VideoCategory | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => VideoCategoryConnection)
  async videoCategoriesConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoCategoryConnectionWhereArgs,
    @Info() info: any
  ): Promise<VideoCategoryConnection> {
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
      result = await this.service.findConnection<VideoCategoryWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoCategoryConnection>;
  }

  @FieldResolver(() => Video)
  async videos(@Root() r: VideoCategory): Promise<Video[] | null> {
    const result = await getConnection()
      .getRepository(VideoCategory)
      .findOne(r.id, { relations: ['videos'] });
    if (result && result.videos !== undefined) {
      return result.videos;
    }
    return null;
  }
}
