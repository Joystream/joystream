import { Category, CategoryId } from '@joystream/types/forum'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import chalk from 'chalk'
import ForumCommandBase from '../../base/ForumCommandBase'
import { Tree } from 'cli-ux/lib/styled/tree'
import { displayTable } from '../../helpers/display'

export default class ForumCategoriesCommand extends ForumCommandBase {
  static description = 'List existing forum categories.'
  static flags = {
    parentCategoryId: flags.integer({
      char: 'p',
      required: false,
      description: 'Parent category id (only child categories will be listed)',
    }),
    tree: flags.boolean({
      char: 'c',
      required: false,
      description: 'Display a category tree (with parentCategoryId as root, if specified)',
    }),
    ...ForumCommandBase.flags,
  }

  recursivelyGenerateCategoryTree(
    tree: Tree,
    parents: [CategoryId, Category][],
    allCategories: [CategoryId, Category][]
  ): void {
    for (const [parentId] of parents) {
      const children = allCategories.filter(([, c]) => c.parent_category_id.unwrapOr(undefined)?.eq(parentId))
      const childSubtree = cli.tree()
      this.recursivelyGenerateCategoryTree(childSubtree, children, allCategories)
      tree.insert(parentId.toString(), childSubtree)
    }
  }

  buildCategoryTree(categories: [CategoryId, Category][], root?: number): Tree {
    const tree = cli.tree()
    let rootCategory: [CategoryId, Category] | undefined
    if (root) {
      rootCategory = categories.find(([id]) => id.toNumber() === root)
      if (!rootCategory) {
        this.error(`Category ${chalk.magentaBright(root)} not found!`)
      }
    }
    const treeRootCategories = rootCategory ? [rootCategory] : categories.filter(([, c]) => c.parent_category_id.isNone)
    this.recursivelyGenerateCategoryTree(tree, treeRootCategories, categories)
    return tree
  }

  async run(): Promise<void> {
    const { parentCategoryId, tree } = this.parse(ForumCategoriesCommand).flags

    if (parentCategoryId !== undefined) {
      await this.ensureCategoryExists(parentCategoryId)
    }

    const categories = await this.getApi().forumCategories()

    if (tree) {
      const categoryTree = this.buildCategoryTree(categories, parentCategoryId)
      categoryTree.display()
    } else {
      const children = categories.filter(
        ([, c]) => c.parent_category_id.unwrapOr(undefined)?.toNumber() === parentCategoryId
      )
      if (children.length) {
        displayTable(
          children.map(([id, c]) => ({
            'ID': id.toString(),
            'Direct subcategories': c.num_direct_subcategories.toNumber(),
            'Direct threads': c.num_direct_threads.toNumber(),
            'Direct modreators': c.num_direct_moderators.toNumber(),
          })),
          5
        )
      } else {
        this.log(
          `No ${
            parentCategoryId !== undefined
              ? `subcategories of category ${chalk.magentaBright(parentCategoryId)}`
              : 'root categories'
          } found`
        )
      }
    }
  }
}
