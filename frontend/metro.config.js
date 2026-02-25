// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Handle WebAssembly (.wasm) files for expo-sqlite web support
config.resolver.assetExts = [...(config.resolver.assetExts || []), 'wasm'];

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
