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
  CategoryCreateInput,
  CategoryCreateManyArgs,
  CategoryUpdateArgs,
  CategoryWhereArgs,
  CategoryWhereInput,
  CategoryWhereUniqueInput,
  CategoryOrderByEnum,
} from '../../../generated';

import { Category } from './category.model';
import { CategoryService } from './category.service';

import { Block } from '../block/block.model';
import { getConnection } from 'typeorm';

@ObjectType()
export class CategoryEdge {
  @Field(() => Category, { nullable: false })
  node!: Category;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class CategoryConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [CategoryEdge], { nullable: false })
  edges!: CategoryEdge[];

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
export class CategoryConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => CategoryWhereInput, { nullable: true })
  where?: CategoryWhereInput;

  @Field(() => CategoryOrderByEnum, { nullable: true })
  orderBy?: CategoryOrderByEnum;
}

@Resolver(Category)
export class CategoryResolver {
  constructor(@Inject('CategoryService') public readonly service: CategoryService) {}

  @Query(() => [Category])
  async categorys(
    @Args() { where, orderBy, limit, offset }: CategoryWhereArgs,
    @Fields() fields: string[]
  ): Promise<Category[]> {
    return this.service.find<CategoryWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => CategoryConnection)
  async categoryConnection(
    @Args() { where, orderBy, ...pageOptions }: CategoryConnectionWhereArgs,
    @RawFields() fields: Record<string, any>
  ): Promise<CategoryConnection> {
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
      result = await this.service.findConnection<CategoryWhereInput>(where, orderBy, pageOptions, fields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<CategoryConnection>;
  }

  @FieldResolver(() => Block)
  async happenedIn(@Root() r: Category): Promise<Block> {
    const result = await getConnection()
      .getRepository(Category)
      .findOne(r.id, { relations: ['happenedIn'] });
    if (!result || !result.happenedIn) {
      throw new Error('Unable to find result for Category.happenedIn');
    }
    return result.happenedIn;
  }
}
