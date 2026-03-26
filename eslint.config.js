// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    settings: {
      // Help eslint resolve imports without extension:
      // "@/components/ui/map-picker" -> map-picker.web.tsx / map-picker.native.tsx
      "import/resolver": {
        node: {
          extensions: [
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".web.ts",
            ".web.tsx",
            ".native.ts",
            ".native.tsx",
          ],
        },
      },
    },
  },
]);
