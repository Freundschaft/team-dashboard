import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config = {
  projects: [
    {
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: [
        '<rootDir>/tests/component/*.test.tsx',
        '<rootDir>/tests/component/*.spec.tsx'
      ],
      transform: {
        '^.+\\.(tsx?|jsx?)$': ['babel-jest', { presets: ['next/babel'] }],
      },
      moduleDirectories: ['node_modules', '<rootDir>/src'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/database/*.test.ts',
        '<rootDir>/tests/database/*.spec.ts'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
  ],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageProvider: 'v8',
  testTimeout: 10000, // 10 seconds for database tests
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async

export default createJestConfig(config)