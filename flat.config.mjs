import eslinter from 'eslint-config-love'
import html from 'eslint-plugin-html'
import pluginReactConfig from 'eslint-plugin-react/configs/all.js'
import { fixupConfigRules } from '@eslint/compat'

// NOTICE: language options mus be added in project level
// {tsconfigRootDir: import.meta.dirname,project: ['./tsconfig.json']}

const languageOptions = {
  parserOptions: {
    extraFileExtensions: ['.html']
  }
}
const reactSettings = {
  settings: {
    react: {
      version: 'detect' // You can add this if you get a warning about the React version when you lint
    }
  }
}
const adaptedReactRules = {
  'react/react-in-jsx-scope': 'off',
  'react/forbid-component-props': 'off',
  'react/jsx-indent': 'off',
  'react/jsx-indent-props': 'off',
  'react/jsx-max-props-per-line': 'off',
  'react/jsx-newline': 'off',
  'react/jsx-one-expression-per-line': 'off',
  'react/jsx-max-depth': 'off',
  'react/require-default-props': 'off',
  'react/function-component-definition': [
    'error',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function'
    }
  ],

  'react/jsx-filename-extension': [
    'error',
    {
      extensions: ['.ts', '.tsx']
    }
  ]
}

eslinter.languageOptions.parserOptions = undefined

export default [
  eslinter,
  { languageOptions },
  { ...reactSettings },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  { plugins: { html } },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  ...fixupConfigRules(pluginReactConfig),
  { rules: adaptedReactRules }
]
