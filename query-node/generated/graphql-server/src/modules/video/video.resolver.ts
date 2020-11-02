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
  VideoCreateInput,
  VideoCreateManyArgs,
  VideoUpdateArgs,
  VideoWhereArgs,
  VideoWhereInput,
  VideoWhereUniqueInput,
  VideoOrderByEnum,
} from '../../../generated';

import { Video } from './video.model';
import { VideoService } from './video.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class VideoEdge {
  @Field(() => Video, { nullable: false })
  node!: Video;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class VideoConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [VideoEdge], { nullable: false })
  edges!: VideoEdge[];

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
export class VideoConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => VideoWhereInput, { nullable: true })
  where?: VideoWhereInput;

  @Field(() => VideoOrderByEnum, { nullable: true })
  orderBy?: VideoOrderByEnum;
}

@Resolver(Video)
export class VideoResolver {
  constructor(@Inject('VideoService') public readonly service: VideoService) {}

  @Query(() => [Video])
  async videos(
    @Args() { where, orderBy, limit, offset }: VideoWhereArgs,
    @Fields() fields: string[]
  ): Promise<Video[]> {
    return this.service.find<VideoWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => VideoConnection)
  async videoConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<VideoConnection> {
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
      result = await this.service.findConnection<VideoWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: Video): Promise<Block> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for Video.happenedIn');
    }
    return result.happenedIn;
  }
}
