import { Pool } from 'pg';

const pool = new Pool(
  process.env.POSTGRES_URL
    ? { connectionString: process.env.POSTGRES_URL }
    : {
        user: process.env.POSTGRES_USER || 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_DB || 'team_dashboard',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
      }
);

export default pool;