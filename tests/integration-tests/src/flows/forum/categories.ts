import { FlowProps } from '../../Flow'
import Debugger from 'debug'
import { FixtureRunner } from '../../Fixture'
import {
  CategoryParams,
  CreateCategoriesFixture,
  CategoryStatusUpdate,
  UpdateCategoriesStatusFixture,
  RemoveCategoriesFixture,
} from '../../fixtures/forum'

export default async function categories({ api, query }: FlowProps): Promise<void> {
  const debug = Debugger(`flow:cateogries`)
  debug('Started')
  api.enableDebugTxLogs()

  // Create root categories
  const categories: CategoryParams[] = [
    { title: 'General', description: 'General stuff' },
    { title: 'Working Groups', description: 'Working groups related discussions' },
  ]

  const createCategoriesFixture = new CreateCategoriesFixture(api, query, categories)
  const createCategoriesRunner = new FixtureRunner(createCategoriesFixture)
  await createCategoriesRunner.run()
  const rootCategoryIds = createCategoriesFixture.getCreatedCategoriesIds()
  const workingGroupsCategoryId = rootCategoryIds[1]

  // Create subcategories
  const workingGroupsSubcategories: CategoryParams[] = [
    {
      title: 'Forum Working Group',
      description: 'Forum Working Group related discussions',
      parentId: workingGroupsCategoryId,
    },
    {
      title: 'Storage Working Group',
      description: 'Storage Working Group related discussions',
      parentId: workingGroupsCategoryId,
    },
    {
      title: 'Membership Working Group',
      description: 'Membership Working Group related discussions',
      parentId: workingGroupsCategoryId,
    },
  ]
  const createSubcategoriesFixture = new CreateCategoriesFixture(api, query, workingGroupsSubcategories)
  const createSubcategoriesRunner = new FixtureRunner(createSubcategoriesFixture)
  await createSubcategoriesRunner.run()
  const subcategoryIds = createSubcategoriesFixture.getCreatedCategoriesIds()

  await Promise.all([createCategoriesRunner.runQueryNodeChecks(), createSubcategoriesRunner.runQueryNodeChecks()])

  // Update archival status
  const categoryUpdatesArchival: CategoryStatusUpdate[] = subcategoryIds.map((id) => ({
    categoryId: id,
    archived: true,
  }))

  const categoryUpdatesArchivalFixture = new UpdateCategoriesStatusFixture(api, query, categoryUpdatesArchival)
  await new FixtureRunner(categoryUpdatesArchivalFixture).runWithQueryNodeChecks()

  const categoryUpdatesActive: CategoryStatusUpdate[] = categoryUpdatesArchival.map((u) => ({ ...u, archived: false }))

  const categoryUpdatesActiveFixture = new UpdateCategoriesStatusFixture(api, query, categoryUpdatesActive)
  await new FixtureRunner(categoryUpdatesActiveFixture).runWithQueryNodeChecks()

  // Remove categories (make sure subcategories are removed first)
  const removeSubcategoriesFixture = new RemoveCategoriesFixture(
    api,
    query,
    subcategoryIds.map((categoryId) => ({ categoryId }))
  )
  const removeRootCategoriesFixture = new RemoveCategoriesFixture(
    api,
    query,
    rootCategoryIds.map((categoryId) => ({ categoryId }))
  )
  const removeSubcategoriesRunner = new FixtureRunner(removeSubcategoriesFixture)
  const removeRootCategoriesRunner = new FixtureRunner(removeRootCategoriesFixture)
  await removeSubcategoriesRunner.run()
  await removeRootCategoriesRunner.run()
  await Promise.all([removeSubcategoriesRunner.runQueryNodeChecks(), removeRootCategoriesRunner.runQueryNodeChecks()])

  debug('Done')
}
