import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.spec.ts'
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.{js,ts}',
    '!<rootDir>/src/**/*.d.ts',
    '!<rootDir>/src/**/types/**',
    '!<rootDir>/src/**/node_modules/**'
  ],
  coverageDirectory: '<rootDir>/tests/coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000, // 10 seconds for database tests
  verbose: true,
  collectCoverage: false, // Set to true when you want coverage reports

  // Handle TypeScript imports in tests
  transform: {
    '^.+\\.(js|ts)$': 'babel-jest'
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)