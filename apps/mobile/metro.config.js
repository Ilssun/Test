// Monorepo setup: lets Metro resolve and transpile the shared @carnet/core
// TypeScript package that lives in ../../packages/core instead of a
// pre-built dist folder.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// IMPORTANT: keep hierarchical lookup enabled (the default). Disabling it
// makes Metro only search the two directories above, which breaks
// resolution of nested (non-hoisted) dependencies like
// react-native/node_modules/@react-native/virtualized-lists — that's what
// caused "Unable to resolve module @react-native/virtualized-lists" on
// native platforms (Android/iOS), even though the web build worked fine.

module.exports = config;
