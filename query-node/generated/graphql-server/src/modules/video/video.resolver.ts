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

import { Channel } from '../channel/channel.model';
import { VideoCategory } from '../video-category/video-category.model';
import { DataObject } from '../data-object/data-object.model';
import { Language } from '../language/language.model';
import { License } from '../license/license.model';
import { VideoMediaMetadata } from '../video-media-metadata/video-media-metadata.model';
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
  orderBy?: [VideoOrderByEnum];
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

  @Query(() => Video, { nullable: true })
  async videoByUniqueInput(
    @Arg('where') where: VideoWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<Video | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => VideoConnection)
  async videosConnection(
    @Args() { where, orderBy, ...pageOptions }: VideoConnectionWhereArgs,
    @Info() info: any
  ): Promise<VideoConnection> {
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
      result = await this.service.findConnection<VideoWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<VideoConnection>;
  }

  @FieldResolver(() => Channel)
  async channel(@Root() r: Video): Promise<Channel | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['channel'] });
    if (result && result.channel !== undefined) {
      return result.channel;
    }
    return null;
  }

  @FieldResolver(() => VideoCategory)
  async category(@Root() r: Video): Promise<VideoCategory | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['category'] });
    if (result && result.category !== undefined) {
      return result.category;
    }
    return null;
  }

  @FieldResolver(() => DataObject)
  async thumbnailPhotoDataObject(@Root() r: Video): Promise<DataObject | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['thumbnailPhotoDataObject'] });
    if (result && result.thumbnailPhotoDataObject !== undefined) {
      return result.thumbnailPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => Language)
  async language(@Root() r: Video): Promise<Language | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['language'] });
    if (result && result.language !== undefined) {
      return result.language;
    }
    return null;
  }

  @FieldResolver(() => License)
  async license(@Root() r: Video): Promise<License | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['license'] });
    if (result && result.license !== undefined) {
      return result.license;
    }
    return null;
  }

  @FieldResolver(() => DataObject)
  async mediaDataObject(@Root() r: Video): Promise<DataObject | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['mediaDataObject'] });
    if (result && result.mediaDataObject !== undefined) {
      return result.mediaDataObject;
    }
    return null;
  }

  @FieldResolver(() => VideoMediaMetadata)
  async mediaMetadata(@Root() r: Video): Promise<VideoMediaMetadata | null> {
    const result = await getConnection()
      .getRepository(Video)
      .findOne(r.id, { relations: ['mediaMetadata'] });
    if (result && result.mediaMetadata !== undefined) {
      return result.mediaMetadata;
    }
    return null;
  }
}
