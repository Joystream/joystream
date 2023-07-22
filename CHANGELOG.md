# Joystream Monorepo ChangeLog

This is a top-level view of changes in the repo, linking to detailed changelogs of individual packages changed.
If no packages or cargo crates are changed then the changes are usually "devops" related.

### 2023-7-20 - Node.js update

This is developer tools update release.

#### Moving to node v18.6.0 from v14
This is a potentially breaking change for your setup, since it requires a minimum GLIBC_2.28 on gnu/linux systems. If you use Ubuntu then you should be at least on the `20.04` release.

To check your glibc version use this command: `ldd --version`

If your version is older than v2.28 you should really consider updating your OS it is probably quite dated and vulnerable to security bugs.

The minimum required node engine for all monorepo packages is updated to v14.18.0

No npm packages have not been published with new engine version yet, so you are not impacted if your application depends on them, until the next package version release. To be ready do one of:

1. Update to latest version of nodejs if possible, or
1. If you have to stick with v14 update to the latest v14 release
  
If you are using volta and your OS distro is fairly new you will not need to do anything, volta will automatically fetch and use required version. For workarounds see the install development tools section in the [README.md](./README.md)