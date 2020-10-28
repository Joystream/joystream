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
  KnownLicenseCreateInput,
  KnownLicenseCreateManyArgs,
  KnownLicenseUpdateArgs,
  KnownLicenseWhereArgs,
  KnownLicenseWhereInput,
  KnownLicenseWhereUniqueInput,
  KnownLicenseOrderByEnum,
} from '../../../generated';

import { KnownLicense } from './known-license.model';
import { KnownLicenseService } from './known-license.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class KnownLicenseEdge {
  @Field(() => KnownLicense, { nullable: false })
  node!: KnownLicense;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class KnownLicenseConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [KnownLicenseEdge], { nullable: false })
  edges!: KnownLicenseEdge[];

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
export class KnownLicenseConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => KnownLicenseWhereInput, { nullable: true })
  where?: KnownLicenseWhereInput;

  @Field(() => KnownLicenseOrderByEnum, { nullable: true })
  orderBy?: KnownLicenseOrderByEnum;
}

@Resolver(KnownLicense)
export class KnownLicenseResolver {
  constructor(@Inject('KnownLicenseService') public readonly service: KnownLicenseService) {}

  @Query(() => [KnownLicense])
  async knownLicenses(
    @Args() { where, orderBy, limit, offset }: KnownLicenseWhereArgs,
    @Fields() fields: string[]
  ): Promise<KnownLicense[]> {
    return this.service.find<KnownLicenseWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => KnownLicenseConnection)
  async knownLicenseConnection(
    @Args() { where, orderBy, ...pageOptions }: KnownLicenseConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<KnownLicenseConnection> {
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
      result = await this.service.findConnection<KnownLicenseWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<KnownLicenseConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: KnownLicense): Promise<Block> {
    const result = await getConnection()
      .getRepository(KnownLicense)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for KnownLicense.happenedIn');
    }
    return result.happenedIn;
  }
}
