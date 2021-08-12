function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function nextTick() {
  return new Promise((resolve) => {
    process.nextTick(resolve)
  })
}

module.exports = {
  sleep,
  nextTick,
}
