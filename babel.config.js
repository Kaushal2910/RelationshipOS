module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // babel-preset-expo (SDK 57) auto-adds react-native-worklets/plugin for Reanimated 4 —
    // do NOT add it manually here or it double-registers.
  };
};
