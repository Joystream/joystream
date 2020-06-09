module.exports = {
    name: 'macos',
    alias: 'osx',
    run: async ({ system, print }) => {
      print.info("MacOS command")
      const osInfo = await system.run(`defaults read loginwindow SystemVersionStampAsString`)
      print.info(osInfo)
    },
  }