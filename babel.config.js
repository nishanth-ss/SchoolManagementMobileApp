module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets-core/plugin',  // First for frame processors
      'react-native-reanimated/plugin',    // Last for animations/JS bridging
    ],
  };
};