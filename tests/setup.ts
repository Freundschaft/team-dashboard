// Global test setup
// This file runs before all tests

import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.local' });

// Global test timeout
jest.setTimeout(10000);

// Global test utilities
declare global {
  var testUtils: {
    sleep: (ms: number) => Promise<void>;
    getTestDbConfig: () => {
      connectionString?: string;
      user?: string;
      host?: string;
      database?: string;
      password?: string;
      port?: number;
    };
  };
}

global.testUtils = {
  // Add any global test utilities here
  sleep: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Test database configuration
  getTestDbConfig: () => {
    // Try to use POSTGRES_URL first (production/hosted database)
    if (process.env.POSTGRES_URL) {
      return {
        connectionString: process.env.POSTGRES_URL
      };
    }
    
    // Fall back to individual connection parameters (local development)
    return {
      user: process.env.POSTGRES_USER || 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost', 
      database: process.env.POSTGRES_DB || 'team_dashboard',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
    };
  }
};

// Setup and teardown hooks
beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});