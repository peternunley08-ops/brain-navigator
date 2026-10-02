// Default Expo config, plus: never crawl the agents' worktrees
// (.claude/worktrees) or the work hub (tools/hub). They hold copies of
// the app's files that Metro must not pick up.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const skip = [/[\\/]\.claude[\\/]worktrees[\\/].*/, /[\\/]tools[\\/]hub[\\/].*/];
const had = config.resolver.blockList;
config.resolver.blockList = [...(Array.isArray(had) ? had : had ? [had] : []), ...skip];

module.exports = config;
