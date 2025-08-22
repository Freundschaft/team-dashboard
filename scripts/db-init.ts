import {config} from 'dotenv';

config({path: '.env.local'});

(async (): Promise<void> => {
  const {initializeDatabase, runMigrations, runConstraints, runSeedData} = await import('@/lib/init-db');
  if (process.argv.includes('--seed')) {
    await runSeedData();
    return;
  }
  if (process.argv.includes('--migrate')) {
    await runMigrations();
    await runConstraints();
    return;
  }

  try {
    console.log('Starting database initialization...');

    await initializeDatabase();
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
})();