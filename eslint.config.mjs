import lintrules from './flat.config.mjs'
import { includeIgnoreFile } from '@eslint/compat'
import { fileURLToPath } from 'url'
import path from 'path'

const ignore = includeIgnoreFile(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '.gitignore')
)

const tempDisabledRules = {
  '@typescript-eslint/no-magic-numbers': 'off',
  'react/jsx-no-bind': [
    'error',
    {
      allowArrowFunctions: true
    }
  ],
  'react/jsx-props-no-spreading': 'off',
  'react/jsx-no-literals': 'off',
  'eslint-comments/require-description': 'off',
  curly: ['error', 'all']
}

const languageOptions = {
  parserOptions: {
    tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
    project: ['./tsconfig.eslint.json']
  }
}

export default [
  ...lintrules,
  { languageOptions },
  { files: ['src/**/*.{ts,tsx,html}'] },
  { rules: tempDisabledRules },
  { ignores: ignore.ignores }
]
