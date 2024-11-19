module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  ignorePatterns: ['.eslintrc.js'],
  plugins: ['eslint-plugin-import', 'eslint-plugin-unused-imports'],
  extends: ['es/node', 'plugin:import/errors', 'plugin:import/warnings'],
  globals: {
    window: false,
    fetch: false,
    Headers: false,
    Request: false,
    XMLHttpRequest: false,
  },
  rules: {
    // Default
    'linebreak-style': 'off',
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    'function-paren-newline': ['error', 'multiline'],
    'array-bracket-spacing': 0,
    'class-methods-use-this': 'off', // Conflicts with functions from interfaces that sometimes don't require `this`
    'comma-dangle': ['error', 'always-multiline'],
    'dot-location': ['error', 'property'],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'no-underscore-dangle': 'off', // Conflicts with external libraries
    'padding-line-between-statements': 'off',
    'no-param-reassign': 'off',
    'func-style': 'off',
    'new-cap': 'off',
    'no-console': 'off',
    'lines-around-comment': [
      'error',
      {
        beforeBlockComment: false,
        afterBlockComment: false,
        beforeLineComment: false,
        afterLineComment: false,
      },
    ],
    'no-multi-assign': 'off',
    'no-plusplus': 'off',
    'guard-for-in': 'off',
    'sort-imports': 'off', // Disabled in favor of eslint-plugin-import
    'prefer-named-capture-group': 'off',
    'max-len': [
      'error',
      {
        code: 120,
        ignoreTemplateLiterals: true,
      },
    ],
    'unicorn/consistent-function-scoping': 'off',
    'no-warning-comments': 'off',
    'no-mixed-operators': 'off',
    'prefer-destructuring': 'off',
    'no-loop-func': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'extended/consistent-err-names': 'off',
    'unicorn/prefer-replace-all': 'off',
    'unicorn/catch-error-name': ['error', { name: 'error' }],
    'unicorn/no-reduce': 'off',
    'no-duplicate-imports': 'off', // Incompatible with type imports
    'unicorn/consistent-destructuring': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/no-new-array': 'off',

    // Import
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unused-modules': 'off',
    'unused-imports/no-unused-imports-ts': 'error',
    'import/no-extraneous-dependencies': 'error',

    'global-require': 'off',
    'tsdoc/syntax': 'off',
    'unicorn/expiring-todo-comments': 'off',
    'unicorn/import-style': 'off',
    'unicorn/prefer-array-flat': 'off',
    'unicorn/prefer-spread': 'off',
  },
  overrides: [
    {
      // Specific rules for bin files
      rules: {
        'unicorn/filename-case': [
          'error',
          {
            case: 'kebabCase',
          },
        ],
        'no-process-env': 'off',
        'unicorn/no-process-exit': 'off',
      },
    },
    {
      // Specific rules for test files
      globals: {
        spyOn: false,
        fail: false,
      },
      env: {
        jest: true,
      },
      rules: {
        'mocha/no-synchronous-tests': 'off',
        'mocha/valid-test-description': 'off',
        'mocha/no-sibling-hooks': 'off',

        'max-statements-per-line': 'off',
        'id-length': 'off',
        'arrow-body-style': 'off',
        'line-comment-position': 'off',
        'no-inline-comments': 'off',
        'unicorn/filename-case': 'off',
        'no-new': 'off',
        'unicorn/no-nested-ternary': 'off',
        'no-return-assign': 'off',
        'no-useless-call': 'off',
        'no-sync': 'off',

        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
