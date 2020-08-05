// return url with last `/` removed
function removeEndingForwardSlash(url) {
  if (url.endsWith('/')) {
    return url.substring(0, url.length - 1)
  }
  return url.toString()
}

module.exports = removeEndingForwardSlash
