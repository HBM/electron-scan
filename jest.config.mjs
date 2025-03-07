const COVERAGE = 100
export default {
  cacheDirectory: '<rootDir>/.cache/unit',
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/app/**/*'],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      branches: COVERAGE,
      functions: COVERAGE,
      lines: COVERAGE,
      statements: COVERAGE
    }
  },
  reporters: ['default', 'jest-junit'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|scss|less)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/fileMock.js'
  },
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['./tests/setupTests.ts'],
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  transform: {
    '^.+\\.(js|ts|tsx)?$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: {
          sourceMap: true,
          allowJs: true
        }
      }
    ]
  },
  testEnvironment: 'node' // changed from jsdom to node
}
