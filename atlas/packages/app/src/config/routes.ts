export default {
  video: (id = ':id') => `/video/${id}`,
  search: (searchStr = ':search') => `/search/${searchStr}`,
}
