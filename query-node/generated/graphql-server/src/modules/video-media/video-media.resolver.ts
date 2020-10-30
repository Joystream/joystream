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
  VideoMediaCreateInput,
  VideoMediaCreateManyArgs,
  VideoMediaUpdateArgs,
  VideoMediaWhereArgs,
  VideoMediaWhereInput,
  VideoMediaWhereUniqueInput,
  VideoMediaOrderByEnum,
} from '../../../generated';

import { VideoMedia } from './video-media.model';
import { VideoMediaService } from './video-media.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class VideoMediaEdge {
  @Field(() => VideoMedia, { nullable: false })
  node!: VideoMedia;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class VideoMediaConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [VideoMediaEdge], { nullable: false })
  edges!: VideoMediaEdge[];

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
export class VideoMediaConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => VideoMediaWhereInput, { nullable: true })
  where?: VideoMediaWhereInput;

  @Field(() => VideoMediaOrderByEnum, { nullable: true })
  orderBy?: VideoMediaOrderByEnum;
}

@Resolver(VideoMedia)
export class VideoMediaResolver {
  constructor(@Inject('VideoMediaService') public readonly service: VideoMediaService) {}

  @Query(() => [VideoMedia])
  async videoMedias(
    @Args() { where, orderBy, limit, offset }: VideoMediaWhereArgs,
    @Fields() fields: string[]
  ): Promise<VideoMedia[]> {
    return this.service.find<VideoMediaWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => VideoMediaConnection)
  async videoMediaConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoMediaConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<VideoMediaConnection> {
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
      result = await this.service.findConnection<VideoMediaWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoMediaConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: VideoMedia): Promise<Block> {
    const result = await getConnection()
      .getRepository(VideoMedia)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for VideoMedia.happenedIn');
    }
    return result.happenedIn;
  }
}
