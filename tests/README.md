# Team Dashboard Tests

This directory contains the test suite for the Team Dashboard application.

## Directory Structure

```
tests/
├── README.md                    # This file
├── jest.config.js              # Jest configuration
├── setup.js                    # Global test setup
├── babel.config.js             # Babel configuration for tests
├── database/                   # Database-level tests
│   └── circular-reference-constraints.test.js
├── integration/                # Integration tests
├── unit/                       # Unit tests
└── utils/                      # Test utilities
    └── database.js             # Database testing utilities
```

## Running Tests

### Install Dependencies
First, make sure you have the test dependencies installed:
```bash
npm install
```

### Available Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only database tests
npm run test:database

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

## Database Tests

The database tests require a running PostgreSQL instance with the team dashboard schema and constraints applied.

### Prerequisites
1. **Database Running**: PostgreSQL should be running and accessible
2. **Schema Applied**: Run the application once to auto-apply schema and constraints
3. **Environment Variables**: Ensure `.env.local` has correct database credentials

### Database Test Categories

#### Circular Reference Constraint Tests
- **Direct circular references**: `A → A`
- **Two-level cycles**: `A → B → A`
- **Multi-level cycles**: `A → B → C → A`
- **Valid operations**: Legal hierarchy changes
- **Error handling**: User-friendly error messages
- **Performance**: Deep hierarchy handling

## Writing Tests

### Database Tests
Use the `DatabaseTestUtils` class for database operations:

```javascript
const DatabaseTestUtils = require('../utils/database');

describe('My Database Test', () => {
  let db;

  beforeAll(async () => {
    db = new DatabaseTestUtils();
    await db.connect();
  });

  afterAll(async () => {
    await db.cleanupTestData();
    await db.disconnect();
  });

  test('should do something', async () => {
    const teamId = await db.createTestTeam('TEST_Team');
    // Your test logic here
  });
});
```

### Test Naming Convention
- Use descriptive test names
- Prefix test data with `TEST_` (automatically cleaned up)
- Group related tests in `describe` blocks

## Configuration

### Jest Configuration
- **Test Environment**: Node.js
- **Test Pattern**: `*.test.js` and `*.spec.js` files
- **Timeout**: 10 seconds (suitable for database tests)
- **Setup**: Global setup in `setup.js`

### Environment Variables
Tests use the same environment variables as the application:
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_DB`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Ensure PostgreSQL is running
   - Check credentials in `.env.local`
   - Verify database exists

2. **Constraint Tests Failing**
   - Ensure database constraints are applied
   - Run the application once to auto-apply constraints
   - Check that triggers exist in the database

3. **Test Timeouts**
   - Database tests may take longer
   - Increase timeout in jest.config.js if needed
   - Check database performance

### Debugging Tests
- Use `console.log()` for debugging (output will be shown)
- Run single test file: `npm test -- tests/database/specific-test.test.js`
- Use `--verbose` flag for detailed output

## Coverage Reports
Coverage reports are generated in `tests/coverage/` when running:
```bash
npm run test:coverage
```

Open `tests/coverage/lcov-report/index.html` in a browser to view detailed coverage.