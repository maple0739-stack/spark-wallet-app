/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  resolver: {
    extraNodeModules: {
      assert: require.resolve('assert/'),
      events: require.resolve('events/'),
      path: require.resolve('path-browserify'),
      querystring: require.resolve('querystring/'),
      stream: require.resolve('stream-browserify'),
      url: require.resolve('url/'),
      util: require.resolve('util/'),
      'xhr2-cookies': require.resolve('./src/shims/xhr2-cookies'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
