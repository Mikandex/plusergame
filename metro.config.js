const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname)

// Web only: force tslib's CJS build (its ESM wrapper breaks under Metro with framer-motion)
const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'tslib') {
    return { type: 'sourceFile', filePath: require.resolve('tslib/tslib.js') }
  }
  return (defaultResolveRequest || context.resolveRequest)(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: './src/global.css' })