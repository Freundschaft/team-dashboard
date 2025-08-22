import { config } from 'dotenv';
config({ path: '.env.local' });

async function main(): Promise<void> {
  const { initializeDatabase } = await import('@/lib/init-db');
  try {
    console.log('Starting database initialization...');

    await initializeDatabase();
    console.log('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main();