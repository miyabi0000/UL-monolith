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
      // サーバー側は構造化ロガー (pino) を使う (Issue #54)
      // クライアント側は console 許容 (dev tool 連携 / 既存デバッグコードのため)
      files: ['server/**/*.ts'],
      rules: {
        'no-console': 'error',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', 'server/dist/'],
};
