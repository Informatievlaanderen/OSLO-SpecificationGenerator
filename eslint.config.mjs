import eslintJs from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // Use ESLint's default configuration
  eslintJs.configs.recommended,

  {
    // Global settings
    files: ['**/*.js'],
    ignores: ['node_modules'],
    languageOptions: {
      globals: {
        ...globals.node,
        window: false,
        fetch: false,
        Headers: false,
        Request: false,
        XMLHttpRequest: false,
      },
    },

    plugins: {
      import: importPlugin,
      'unused-imports': unusedImportsPlugin,
    },

    rules: {
      // Code Style
      'linebreak-style': 'off',
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'function-paren-newline': ['error', 'multiline'],
      'array-bracket-spacing': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'dot-location': ['error', 'property'],
      'max-len': [
        'error',
        {
          code: 120,
          ignoreTemplateLiterals: true,
        },
      ],

      // Class & Function Rules
      'class-methods-use-this': 'off',
      'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
      'func-style': 'off',
      'new-cap': 'off',
      'no-loop-func': 'off',

      // Code Organization
      'lines-around-comment': [
        'error',
        {
          beforeBlockComment: false,
          afterBlockComment: false,
          beforeLineComment: false,
          afterLineComment: false,
        },
      ],
      'padding-line-between-statements': 'off',
      'sort-imports': 'off',

      // Variables & Parameters
      'no-underscore-dangle': 'off',
      'no-param-reassign': 'off',
      'no-multi-assign': 'off',
      'prefer-destructuring': 'off',

      // Import/Export Rules
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
      'import/no-extraneous-dependencies': 'error',
      'no-duplicate-imports': 'off',

      // Disabled Rules
      'guard-for-in': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
      'no-warning-comments': 'off',
      'no-mixed-operators': 'off',
      'prefer-named-capture-group': 'off',
      'global-require': 'off',

      // Other
      'extended/consistent-err-names': 'off',
    },
  },
];
