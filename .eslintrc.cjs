module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'no-unused-vars': 'off',
  },
  overrides: [
    {
      // サーバー側は型安全性を強める (Issue #53 / #54)
      // - no-console: 構造化ロガー (pino) を強制
      // - no-explicit-any: any 型は unknown + 型ガードで代替
      // テストファイル (mock 等で any が便利) は除外。
      files: ['server/**/*.ts'],
      excludedFiles: ['server/**/__tests__/**', 'server/**/*.test.ts'],
      rules: {
        'no-console': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'server/dist/'],
};
