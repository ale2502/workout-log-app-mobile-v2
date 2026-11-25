// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // SDK 56's eslint-config-expo turned this on as an error. manage-gyms.tsx
      // still syncs state in effects (3 spots), so keep them visible as warnings
      // until that screen is refactored.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
