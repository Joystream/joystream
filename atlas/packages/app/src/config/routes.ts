export default {
  video: (id = ':id') => `/video/${id}`,
  search: (searchStr = ':search') => `/search/${searchStr}`,
  channel: (id = ':id') => `/channel/${id}`,
  browse: () => 'browse',
}
