module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {},
  overrides: [{
    files: [
      "src/index.cjs"
    ],
    parserOptions: {
      sourceType: "script"
    }
  }]
}
