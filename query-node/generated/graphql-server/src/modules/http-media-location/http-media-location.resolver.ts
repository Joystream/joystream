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
  HttpMediaLocationCreateInput,
  HttpMediaLocationCreateManyArgs,
  HttpMediaLocationUpdateArgs,
  HttpMediaLocationWhereArgs,
  HttpMediaLocationWhereInput,
  HttpMediaLocationWhereUniqueInput,
  HttpMediaLocationOrderByEnum,
} from '../../../generated';

import { HttpMediaLocation } from './http-media-location.model';
import { HttpMediaLocationService } from './http-media-location.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class HttpMediaLocationEdge {
  @Field(() => HttpMediaLocation, { nullable: false })
  node!: HttpMediaLocation;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class HttpMediaLocationConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [HttpMediaLocationEdge], { nullable: false })
  edges!: HttpMediaLocationEdge[];

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
export class HttpMediaLocationConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => HttpMediaLocationWhereInput, { nullable: true })
  where?: HttpMediaLocationWhereInput;

  @Field(() => HttpMediaLocationOrderByEnum, { nullable: true })
  orderBy?: HttpMediaLocationOrderByEnum;
}

@Resolver(HttpMediaLocation)
export class HttpMediaLocationResolver {
  constructor(@Inject('HttpMediaLocationService') public readonly service: HttpMediaLocationService) {}

  @Query(() => [HttpMediaLocation])
  async httpMediaLocations(
    @Args() { where, orderBy, limit, offset }: HttpMediaLocationWhereArgs,
    @Fields() fields: string[]
  ): Promise<HttpMediaLocation[]> {
    return this.service.find<HttpMediaLocationWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => HttpMediaLocationConnection)
  async httpMediaLocationConnection(
    @Args() { where, orderBy, ...pageOptions }: HttpMediaLocationConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<HttpMediaLocationConnection> {
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
      result = await this.service.findConnection<HttpMediaLocationWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<HttpMediaLocationConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: HttpMediaLocation): Promise<Block> {
    const result = await getConnection()
      .getRepository(HttpMediaLocation)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for HttpMediaLocation.happenedIn');
    }
    return result.happenedIn;
  }
}
