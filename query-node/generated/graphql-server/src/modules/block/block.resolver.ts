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
  BlockCreateInput,
  BlockCreateManyArgs,
  BlockUpdateArgs,
  BlockWhereArgs,
  BlockWhereInput,
  BlockWhereUniqueInput,
  BlockOrderByEnum,
} from '../../../generated';

import { Block } from './block.model';
import { BlockService } from './block.service';

import { Category } from '../category/category.model';
import { Channel } from '../channel/channel.model';
import { ClassEntity } from '../class-entity/class-entity.model';
import { HttpMediaLocation } from '../http-media-location/http-media-location.model';
import { JoystreamMediaLocation } from '../joystream-media-location/joystream-media-location.model';
import { KnownLicense } from '../known-license/known-license.model';
import { Language } from '../language/language.model';
import { Member } from '../member/member.model';
import { UserDefinedLicense } from '../user-defined-license/user-defined-license.model';
import { Video } from '../video/video.model';
import { VideoMedia } from '../video-media/video-media.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class BlockEdge {
  @Field(() => Block, { nullable: false })
  node!: Block;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class BlockConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [BlockEdge], { nullable: false })
  edges!: BlockEdge[];

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
export class BlockConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => BlockWhereInput, { nullable: true })
  where?: BlockWhereInput;

  @Field(() => BlockOrderByEnum, { nullable: true })
  orderBy?: BlockOrderByEnum;
}

@Resolver(Block)
export class BlockResolver {
  constructor(@Inject('BlockService') public readonly service: BlockService) {}

  @Query(() => [Block])
  async blocks(
    @Args() { where, orderBy, limit, offset }: BlockWhereArgs,
    @Fields() fields: string[]
  ): Promise<Block[]> {
    return this.service.find<BlockWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => BlockConnection)
  async blockConnection(
    @Args() { where, orderBy, ...pageOptions }: BlockConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<BlockConnection> {
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
      result = await this.service.findConnection<BlockWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<BlockConnection>;
  }

  @FieldResolver(() => Category)
  async categorys(@Root() r: Block): Promise<Category[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['categorys'] });
    if (!result || !result.categorys) {
      throw new Error('Unable to find result for Block.categorys');
    }
    return result.categorys;
  }
  @FieldResolver(() => Channel)
  async channels(@Root() r: Block): Promise<Channel[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['channels'] });
    if (!result || !result.channels) {
      throw new Error('Unable to find result for Block.channels');
    }
    return result.channels;
  }
  @FieldResolver(() => ClassEntity)
  async classEntitys(@Root() r: Block): Promise<ClassEntity[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['classEntitys'] });
    if (!result || !result.classEntitys) {
      throw new Error('Unable to find result for Block.classEntitys');
    }
    return result.classEntitys;
  }
  @FieldResolver(() => HttpMediaLocation)
  async httpMediaLocations(@Root() r: Block): Promise<HttpMediaLocation[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['httpMediaLocations'] });
    if (!result || !result.httpMediaLocations) {
      throw new Error('Unable to find result for Block.httpMediaLocations');
    }
    return result.httpMediaLocations;
  }
  @FieldResolver(() => JoystreamMediaLocation)
  async joystreamMediaLocations(@Root() r: Block): Promise<JoystreamMediaLocation[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['joystreamMediaLocations'] });
    if (!result || !result.joystreamMediaLocations) {
      throw new Error('Unable to find result for Block.joystreamMediaLocations');
    }
    return result.joystreamMediaLocations;
  }
  @FieldResolver(() => KnownLicense)
  async knownLicenses(@Root() r: Block): Promise<KnownLicense[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['knownLicenses'] });
    if (!result || !result.knownLicenses) {
      throw new Error('Unable to find result for Block.knownLicenses');
    }
    return result.knownLicenses;
  }
  @FieldResolver(() => Language)
  async languages(@Root() r: Block): Promise<Language[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['languages'] });
    if (!result || !result.languages) {
      throw new Error('Unable to find result for Block.languages');
    }
    return result.languages;
  }
  @FieldResolver(() => Member)
  async members(@Root() r: Block): Promise<Member[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['members'] });
    if (!result || !result.members) {
      throw new Error('Unable to find result for Block.members');
    }
    return result.members;
  }
  @FieldResolver(() => UserDefinedLicense)
  async userDefinedLicenses(@Root() r: Block): Promise<UserDefinedLicense[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['userDefinedLicenses'] });
    if (!result || !result.userDefinedLicenses) {
      throw new Error('Unable to find result for Block.userDefinedLicenses');
    }
    return result.userDefinedLicenses;
  }
  @FieldResolver(() => Video)
  async videos(@Root() r: Block): Promise<Video[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['videos'] });
    if (!result || !result.videos) {
      throw new Error('Unable to find result for Block.videos');
    }
    return result.videos;
  }
  @FieldResolver(() => VideoMedia)
  async videoMedias(@Root() r: Block): Promise<VideoMedia[]> {
    const result = await getConnection()
      .getRepository(Block)
      .findOne(r.id, { relations: ['videoMedias'] });
    if (!result || !result.videoMedias) {
      throw new Error('Unable to find result for Block.videoMedias');
    }
    return result.videoMedias;
  }
}
