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
  JoystreamMediaLocationCreateInput,
  JoystreamMediaLocationCreateManyArgs,
  JoystreamMediaLocationUpdateArgs,
  JoystreamMediaLocationWhereArgs,
  JoystreamMediaLocationWhereInput,
  JoystreamMediaLocationWhereUniqueInput,
  JoystreamMediaLocationOrderByEnum,
} from '../../../generated';

import { JoystreamMediaLocation } from './joystream-media-location.model';
import { JoystreamMediaLocationService } from './joystream-media-location.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class JoystreamMediaLocationEdge {
  @Field(() => JoystreamMediaLocation, { nullable: false })
  node!: JoystreamMediaLocation;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class JoystreamMediaLocationConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [JoystreamMediaLocationEdge], { nullable: false })
  edges!: JoystreamMediaLocationEdge[];

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
export class JoystreamMediaLocationConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => JoystreamMediaLocationWhereInput, { nullable: true })
  where?: JoystreamMediaLocationWhereInput;

  @Field(() => JoystreamMediaLocationOrderByEnum, { nullable: true })
  orderBy?: JoystreamMediaLocationOrderByEnum;
}

@Resolver(JoystreamMediaLocation)
export class JoystreamMediaLocationResolver {
  constructor(@Inject('JoystreamMediaLocationService') public readonly service: JoystreamMediaLocationService) {}

  @Query(() => [JoystreamMediaLocation])
  async joystreamMediaLocations(
    @Args() { where, orderBy, limit, offset }: JoystreamMediaLocationWhereArgs,
    @Fields() fields: string[]
  ): Promise<JoystreamMediaLocation[]> {
    return this.service.find<JoystreamMediaLocationWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => JoystreamMediaLocationConnection)
  async joystreamMediaLocationConnection(
    @Args() { where, orderBy, ...pageOptions }: JoystreamMediaLocationConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<JoystreamMediaLocationConnection> {
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
      result = await this.service.findConnection<JoystreamMediaLocationWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<JoystreamMediaLocationConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: JoystreamMediaLocation): Promise<Block> {
    const result = await getConnection()
      .getRepository(JoystreamMediaLocation)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for JoystreamMediaLocation.happenedIn');
    }
    return result.happenedIn;
  }
}
