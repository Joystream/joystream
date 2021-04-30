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
  DataObjectCreateInput,
  DataObjectCreateManyArgs,
  DataObjectUpdateArgs,
  DataObjectWhereArgs,
  DataObjectWhereInput,
  DataObjectWhereUniqueInput,
  DataObjectOrderByEnum,
} from '../../../generated';

import { DataObject } from './data-object.model';
import { DataObjectService } from './data-object.service';

import { StorageProvider } from '../storage-provider/storage-provider.model';
import { Channel } from '../channel/channel.model';
import { Video } from '../video/video.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class DataObjectEdge {
  @Field(() => DataObject, { nullable: false })
  node!: DataObject;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class DataObjectConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [DataObjectEdge], { nullable: false })
  edges!: DataObjectEdge[];

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
export class DataObjectConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => DataObjectWhereInput, { nullable: true })
  where?: DataObjectWhereInput;

  @Field(() => DataObjectOrderByEnum, { nullable: true })
  orderBy?: DataObjectOrderByEnum;
}

@Resolver(DataObject)
export class DataObjectResolver {
  constructor(@Inject('DataObjectService') public readonly service: DataObjectService) {}

  @Query(() => [DataObject])
  async dataObjects(
    @Args() { where, orderBy, limit, offset }: DataObjectWhereArgs,
    @Fields() fields: string[]
  ): Promise<DataObject[]> {
    return this.service.find<DataObjectWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => DataObject, { nullable: true })
  async dataObjectByUniqueInput(
    @Arg('where') where: DataObjectWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<DataObject | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => DataObjectConnection)
  async dataObjectsConnection(
    @Args() { where, orderBy, ...pageOptions }: DataObjectConnectionWhereArgs,
    @Info() info: any
  ): Promise<DataObjectConnection> {
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
      result = await this.service.findConnection<DataObjectWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<DataObjectConnection>;
  }

  @FieldResolver(() => StorageProvider)
  async liaison(@Root() r: DataObject): Promise<StorageProvider | null> {
    const result = await getConnection()
      .getRepository(DataObject)
      .findOne(r.id, { relations: ['liaison'] });
    if (result && result.liaison !== undefined) {
      return result.liaison;
    }
    return null;
  }

  @FieldResolver(() => Channel)
  async channelcoverPhotoDataObject(@Root() r: DataObject): Promise<Channel[] | null> {
    const result = await getConnection()
      .getRepository(DataObject)
      .findOne(r.id, { relations: ['channelcoverPhotoDataObject'] });
    if (result && result.channelcoverPhotoDataObject !== undefined) {
      return result.channelcoverPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => Channel)
  async channelavatarPhotoDataObject(@Root() r: DataObject): Promise<Channel[] | null> {
    const result = await getConnection()
      .getRepository(DataObject)
      .findOne(r.id, { relations: ['channelavatarPhotoDataObject'] });
    if (result && result.channelavatarPhotoDataObject !== undefined) {
      return result.channelavatarPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => Video)
  async videothumbnailPhotoDataObject(@Root() r: DataObject): Promise<Video[] | null> {
    const result = await getConnection()
      .getRepository(DataObject)
      .findOne(r.id, { relations: ['videothumbnailPhotoDataObject'] });
    if (result && result.videothumbnailPhotoDataObject !== undefined) {
      return result.videothumbnailPhotoDataObject;
    }
    return null;
  }

  @FieldResolver(() => Video)
  async videomediaDataObject(@Root() r: DataObject): Promise<Video[] | null> {
    const result = await getConnection()
      .getRepository(DataObject)
      .findOne(r.id, { relations: ['videomediaDataObject'] });
    if (result && result.videomediaDataObject !== undefined) {
      return result.videomediaDataObject;
    }
    return null;
  }
}
