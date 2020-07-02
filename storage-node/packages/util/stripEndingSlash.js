// return url with last `/` removed
function removeEndingForwardSlash(url) {
	const st = new String(url)
	if (st.endsWith('/')) {
		return st.substring(0, st.length - 1)
	}
	return st.toString()
}

module.exports = removeEndingForwardSlash
