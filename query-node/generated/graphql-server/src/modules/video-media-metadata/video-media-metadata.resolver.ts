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
  VideoMediaMetadataCreateInput,
  VideoMediaMetadataCreateManyArgs,
  VideoMediaMetadataUpdateArgs,
  VideoMediaMetadataWhereArgs,
  VideoMediaMetadataWhereInput,
  VideoMediaMetadataWhereUniqueInput,
  VideoMediaMetadataOrderByEnum,
} from '../../../generated';

import { VideoMediaMetadata } from './video-media-metadata.model';
import { VideoMediaMetadataService } from './video-media-metadata.service';

import { VideoMediaEncoding } from '../video-media-encoding/video-media-encoding.model';
import { Video } from '../video/video.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class VideoMediaMetadataEdge {
  @Field(() => VideoMediaMetadata, { nullable: false })
  node!: VideoMediaMetadata;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class VideoMediaMetadataConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [VideoMediaMetadataEdge], { nullable: false })
  edges!: VideoMediaMetadataEdge[];

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
export class VideoMediaMetadataConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => VideoMediaMetadataWhereInput, { nullable: true })
  where?: VideoMediaMetadataWhereInput;

  @Field(() => VideoMediaMetadataOrderByEnum, { nullable: true })
  orderBy?: [VideoMediaMetadataOrderByEnum];
}

@Resolver(VideoMediaMetadata)
export class VideoMediaMetadataResolver {
  constructor(@Inject('VideoMediaMetadataService') public readonly service: VideoMediaMetadataService) {}

  @Query(() => [VideoMediaMetadata])
  async videoMediaMetadata(
    @Args() { where, orderBy, limit, offset }: VideoMediaMetadataWhereArgs,
    @Fields() fields: string[]
  ): Promise<VideoMediaMetadata[]> {
    return this.service.find<VideoMediaMetadataWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => VideoMediaMetadata, { nullable: true })
  async videoMediaMetadataByUniqueInput(
    @Arg('where') where: VideoMediaMetadataWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<VideoMediaMetadata | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => VideoMediaMetadataConnection)
  async videoMediaMetadataConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoMediaMetadataConnectionWhereArgs,
    @Info() info: any
  ): Promise<VideoMediaMetadataConnection> {
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
      result = await this.service.findConnection<VideoMediaMetadataWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoMediaMetadataConnection>;
  }

  @FieldResolver(() => VideoMediaEncoding)
  async encoding(@Root() r: VideoMediaMetadata): Promise<VideoMediaEncoding | null> {
    const result = await getConnection()
      .getRepository(VideoMediaMetadata)
      .findOne(r.id, { relations: ['encoding'] });
    if (result && result.encoding !== undefined) {
      return result.encoding;
    }
    return null;
  }

  @FieldResolver(() => Video)
  async video(@Root() r: VideoMediaMetadata): Promise<Video | null> {
    const result = await getConnection()
      .getRepository(VideoMediaMetadata)
      .findOne(r.id, { relations: ['video'] });
    if (result && result.video !== undefined) {
      return result.video;
    }
    return null;
  }
}
