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
  LicenseCreateInput,
  LicenseCreateManyArgs,
  LicenseUpdateArgs,
  LicenseWhereArgs,
  LicenseWhereInput,
  LicenseWhereUniqueInput,
  LicenseOrderByEnum,
} from '../../../generated';

import { License } from './license.model';
import { LicenseService } from './license.service';

import { Video } from '../video/video.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class LicenseEdge {
  @Field(() => License, { nullable: false })
  node!: License;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class LicenseConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [LicenseEdge], { nullable: false })
  edges!: LicenseEdge[];

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
export class LicenseConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => LicenseWhereInput, { nullable: true })
  where?: LicenseWhereInput;

  @Field(() => LicenseOrderByEnum, { nullable: true })
  orderBy?: [LicenseOrderByEnum];
}

@Resolver(License)
export class LicenseResolver {
  constructor(@Inject('LicenseService') public readonly service: LicenseService) {}

  @Query(() => [License])
  async licenses(
    @Args() { where, orderBy, limit, offset }: LicenseWhereArgs,
    @Fields() fields: string[]
  ): Promise<License[]> {
    return this.service.find<LicenseWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => License, { nullable: true })
  async licenseByUniqueInput(
    @Arg('where') where: LicenseWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<License | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => LicenseConnection)
  async licensesConnection(
    @Args() { where, orderBy, ...pageOptions }: LicenseConnectionWhereArgs,
    @Info() info: any
  ): Promise<LicenseConnection> {
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
      result = await this.service.findConnection<LicenseWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<LicenseConnection>;
  }

  @FieldResolver(() => Video)
  async videolicense(@Root() r: License): Promise<Video[] | null> {
    const result = await getConnection()
      .getRepository(License)
      .findOne(r.id, { relations: ['videolicense'] });
    if (result && result.videolicense !== undefined) {
      return result.videolicense;
    }
    return null;
  }
}
