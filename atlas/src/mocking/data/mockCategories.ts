import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'
import rawCategories from './raw/categories.json'

type MockCategory = CategoryFields

const mockCategories: MockCategory[] = rawCategories.map((c) => ({ ...c, __typename: 'Category' }))

export default mockCategories
