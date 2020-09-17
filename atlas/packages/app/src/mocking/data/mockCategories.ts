import { CategoryFields } from '@/api/queries/__generated__/CategoryFields'

type RawCategory = Omit<CategoryFields, '__typename'>

const rawCategories: RawCategory[] = [
  {
    id: 'db931957-f905-4c40-b708-85fcabcba4f9',
    name: 'Sport',
  },
  {
    id: 'a8f16c74-7040-4c61-afef-ca70b90b0c03',
    name: 'Health & Fitness',
  },
  {
    id: '1429bd8e-b5d9-426a-9090-83002ca2ea9e',
    name: 'Lifestyle',
  },
  {
    id: '02c287dc-0b35-41f8-a494-9d98e312fbff',
    name: 'Business',
  },
]

const mockCategories: CategoryFields[] = rawCategories.map((c) => ({ ...c, __typename: 'Category' }))

export default mockCategories
