const EXPECTED_CLASS_ORDER = [
  'Channel',
  'ContentCategory',
  'HttpMediaLocation',
  'JoystreamMediaLocation',
  'KnownLicense',
  'Language',
  'License',
  'MediaLocation',
  'UserDefinedLicense',
  'Video',
  'VideoMedia',
  'VideoMediaEncoding',
  'FeaturedVideo',
]

// Exports class input jsons in a predictable order
module.exports = EXPECTED_CLASS_ORDER.map((className) => require(`./${className}Class.json`))
