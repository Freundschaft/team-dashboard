// Database test utilities
import { Pool, QueryResult } from 'pg';


interface TeamHierarchyRow {
  id: number;
  name: string;
  parent_id: number | null;
  level: number;
  path: string;
}

class DatabaseTestUtils {
  private pool: Pool | null = null;

  // Initialize database connection
  async connect(): Promise<Pool> {
    if (!this.pool) {
      const config = global.testUtils.getTestDbConfig();
      this.pool = new Pool(config);
      
      // Add error handler to prevent unhandled errors
      this.pool.on('error', (err) => {
        console.warn('Database pool error (handled):', err.message);
      });
    }
    return this.pool;
  }

  // Close database connection
  async disconnect(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch (error) {
        console.warn('Error closing database pool (ignored):', error instanceof Error ? error.message : error);
      } finally {
        this.pool = null;
      }
    }
  }

  // Execute raw SQL query
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    const pool = await this.connect();
    return pool.query(sql, params);
  }

  // Create a test team
  async createTestTeam(
    name: string, 
    description: string | null = null, 
    department: string | null = null, 
    parent_id: number | null = null
  ): Promise<number> {
    const query = `
      INSERT INTO teams (name, description, department, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const result = await this.query(query, [name, description, department, parent_id]);
    return result.rows[0].id;
  }

  // Update team parent
  async updateTeamParent(teamId: number, parentId: number | null): Promise<void> {
    const query = `UPDATE teams SET parent_id = $1 WHERE id = $2`;
    await this.query(query, [parentId, teamId]);
  }

  // Create test user
  async createTestUser(name: string, email: string): Promise<number> {
    const query = `
      INSERT INTO users (name, email)
      VALUES ($1, $2)
      RETURNING id
    `;
    const result = await this.query(query, [name, email]);
    return result.rows[0].id;
  }

  // Clean up all test data (anything with TEST_ prefix)
  async cleanupTestData(): Promise<void> {
    await this.query("DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE name LIKE 'TEST_%')");
    await this.query("DELETE FROM teams WHERE name LIKE 'TEST_%'");
    await this.query("DELETE FROM users WHERE name LIKE 'TEST_%'");
  }

  // Check if constraints exist
  async checkConstraintsExist(): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE event_object_schema = 'public' 
        AND event_object_table = 'teams'
        AND trigger_name = 'check_team_circular_reference'
      ) as constraint_exists
    `;
    const result = await this.query(query);
    return result.rows[0].constraint_exists;
  }

  // Get team hierarchy for testing
  async getTeamHierarchy(): Promise<TeamHierarchyRow[]> {
    const query = `
      WITH RECURSIVE team_hierarchy AS (
        SELECT id, name, parent_id, 0 as level, CAST(name AS TEXT) as path
        FROM teams 
        WHERE parent_id IS NULL
        
        UNION ALL
        
        SELECT t.id, t.name, t.parent_id, th.level + 1, CAST(th.path || ' > ' || t.name AS TEXT)
        FROM teams t
        JOIN team_hierarchy th ON t.parent_id = th.id
      )
      SELECT * FROM team_hierarchy ORDER BY level, name
    `;
    const result = await this.query(query);
    return result.rows;
  }

  // Test helper: expect query to throw circular reference error
  async expectCircularReferenceError(queryFn: () => Promise<any>): Promise<Error> {
    try {
      await queryFn();
      throw new Error('Expected circular reference error but query succeeded');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('circular reference')) {
        throw new Error(`Expected circular reference error but got: ${errorMessage}`);
      }
      return error as Error; // Return the expected error
    }
  }
}

export default DatabaseTestUtils;