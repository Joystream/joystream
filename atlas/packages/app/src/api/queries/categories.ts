import gql from 'graphql-tag'

const categoriesFieldsFragment = gql`
  fragment CategoryFields on Category {
    id
    name
  }
`

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      ...CategoryFields
    }
  }
  ${categoriesFieldsFragment}
`
