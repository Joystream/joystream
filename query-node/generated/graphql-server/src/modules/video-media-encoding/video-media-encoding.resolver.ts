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
  VideoMediaEncodingCreateInput,
  VideoMediaEncodingCreateManyArgs,
  VideoMediaEncodingUpdateArgs,
  VideoMediaEncodingWhereArgs,
  VideoMediaEncodingWhereInput,
  VideoMediaEncodingWhereUniqueInput,
  VideoMediaEncodingOrderByEnum,
} from '../../../generated';

import { VideoMediaEncoding } from './video-media-encoding.model';
import { VideoMediaEncodingService } from './video-media-encoding.service';

import { VideoMediaMetadata } from '../video-media-metadata/video-media-metadata.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class VideoMediaEncodingEdge {
  @Field(() => VideoMediaEncoding, { nullable: false })
  node!: VideoMediaEncoding;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class VideoMediaEncodingConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [VideoMediaEncodingEdge], { nullable: false })
  edges!: VideoMediaEncodingEdge[];

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
export class VideoMediaEncodingConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => VideoMediaEncodingWhereInput, { nullable: true })
  where?: VideoMediaEncodingWhereInput;

  @Field(() => VideoMediaEncodingOrderByEnum, { nullable: true })
  orderBy?: [VideoMediaEncodingOrderByEnum];
}

@Resolver(VideoMediaEncoding)
export class VideoMediaEncodingResolver {
  constructor(@Inject('VideoMediaEncodingService') public readonly service: VideoMediaEncodingService) {}

  @Query(() => [VideoMediaEncoding])
  async videoMediaEncodings(
    @Args() { where, orderBy, limit, offset }: VideoMediaEncodingWhereArgs,
    @Fields() fields: string[]
  ): Promise<VideoMediaEncoding[]> {
    return this.service.find<VideoMediaEncodingWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => VideoMediaEncoding, { nullable: true })
  async videoMediaEncodingByUniqueInput(
    @Arg('where') where: VideoMediaEncodingWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<VideoMediaEncoding | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => VideoMediaEncodingConnection)
  async videoMediaEncodingsConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoMediaEncodingConnectionWhereArgs,
    @Info() info: any
  ): Promise<VideoMediaEncodingConnection> {
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
      result = await this.service.findConnection<VideoMediaEncodingWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoMediaEncodingConnection>;
  }

  @FieldResolver(() => VideoMediaMetadata)
  async videomediametadataencoding(@Root() r: VideoMediaEncoding): Promise<VideoMediaMetadata[] | null> {
    const result = await getConnection()
      .getRepository(VideoMediaEncoding)
      .findOne(r.id, { relations: ['videomediametadataencoding'] });
    if (result && result.videomediametadataencoding !== undefined) {
      return result.videomediametadataencoding;
    }
    return null;
  }
}
