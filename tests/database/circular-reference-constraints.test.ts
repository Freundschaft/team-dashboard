// Tests for database circular reference constraints
import DatabaseTestUtils from '../utils/database';

describe('Circular Reference Constraints', () => {
  let db: DatabaseTestUtils;

  beforeAll(async () => {
    db = new DatabaseTestUtils();
    await db.connect();
    
    // Ensure constraints exist before testing
    const constraintsExist = await db.checkConstraintsExist();
    if (!constraintsExist) {
      throw new Error('Database constraints not found. Run database initialization first.');
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data before each test
    await db.cleanupTestData();
  });

  afterAll(async () => {
    // Final cleanup and disconnect
    await db.cleanupTestData();
    await db.disconnect();
  });

  describe('Direct Circular References', () => {
    test('should prevent team from being its own parent', async () => {
      // Create test team
      const teamA = await db.createTestTeam('TEST_Team_A');

      // Attempt to make team its own parent should fail
      await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamA, teamA);
      });
    });
  });

  describe('Two-Level Circular References', () => {
    test('should prevent A → B → A cycle', async () => {
      // Create Team A
      const teamA = await db.createTestTeam('TEST_Team_A');
      
      // Create Team B with A as parent (A → B)
      const teamB = await db.createTestTeam('TEST_Team_B', null, null, teamA);
      
      // Attempting to make A a child of B should fail (would create A → B → A)
      await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamA, teamB);
      });
    });
  });

  describe('Multi-Level Circular References', () => {
    test('should prevent A → B → C → A cycle', async () => {
      // Create hierarchy: A → B → C
      const teamA = await db.createTestTeam('TEST_Team_A');
      const teamB = await db.createTestTeam('TEST_Team_B', null, null, teamA);
      const teamC = await db.createTestTeam('TEST_Team_C', null, null, teamB);
      
      // Attempting to make A a child of C should fail (would create A → B → C → A)
      await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamA, teamC);
      });
    });

    test('should prevent A → B → C → D → A cycle', async () => {
      // Create hierarchy: A → B → C → D
      const teamA = await db.createTestTeam('TEST_Team_A');
      const teamB = await db.createTestTeam('TEST_Team_B', null, null, teamA);
      const teamC = await db.createTestTeam('TEST_Team_C', null, null, teamB);
      const teamD = await db.createTestTeam('TEST_Team_D', null, null, teamC);
      
      // Attempting to make A a child of D should fail
      await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamA, teamD);
      });
    });
  });

  describe('Valid Operations', () => {
    test('should allow valid parent updates', async () => {
      // Create independent teams
      const teamA = await db.createTestTeam('TEST_Team_A');
      const teamB = await db.createTestTeam('TEST_Team_B');
      const teamC = await db.createTestTeam('TEST_Team_C', null, null, teamA);
      
      // Moving Team C from A to B should succeed
      await db.updateTeamParent(teamC, teamB);
      
      // Verify the change
      const result = await db.query('SELECT parent_id FROM teams WHERE id = $1', [teamC]);
      expect(result.rows[0].parent_id).toBe(teamB);
    });

    test('should allow creating deep valid hierarchies', async () => {
      // Create a 5-level hierarchy
      const engineering = await db.createTestTeam('TEST_Engineering');
      const frontend = await db.createTestTeam('TEST_Frontend', null, null, engineering);
      const react = await db.createTestTeam('TEST_React', null, null, frontend);
      const components = await db.createTestTeam('TEST_Components', null, null, react);
      const buttons = await db.createTestTeam('TEST_Buttons', null, null, components);
      
      // Verify hierarchy was created correctly
      const hierarchy = await db.getTeamHierarchy();
      const testHierarchy = hierarchy.filter(team => team.name.startsWith('TEST_'));
      
      expect(testHierarchy.length).toBe(5);
      expect(testHierarchy[0].level).toBe(0); // Root level
      expect(testHierarchy[4].level).toBe(4); // 5th level
    });

    test('should allow setting parent to null (making team a root)', async () => {
      // Create team with parent
      const teamA = await db.createTestTeam('TEST_Team_A');
      const teamB = await db.createTestTeam('TEST_Team_B', null, null, teamA);
      
      // Make Team B a root team
      await db.updateTeamParent(teamB, null);
      
      // Verify the change
      const result = await db.query('SELECT parent_id FROM teams WHERE id = $1', [teamB]);
      expect(result.rows[0].parent_id).toBeNull();
    });
  });

  describe('Error Messages', () => {
    test('should provide user-friendly error messages', async () => {
      const teamA = await db.createTestTeam('TEST_Team_A');
      
      const error = await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamA, teamA);
      });
      
      expect(error.message).toMatch(/circular reference/i);
      expect(error.message).not.toMatch(/trigger/i); // Shouldn't expose internal details
    });
  });

  describe('Performance', () => {
    test('should handle deep hierarchies efficiently', async () => {
      // Create a 10-level hierarchy
      let currentParent: number | null = null;
      const teamIds: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const teamId = await db.createTestTeam(`TEST_Level_${i}`, null, null, currentParent);
        teamIds.push(teamId);
        currentParent = teamId;
      }
      
      // Try to create circular reference with deepest team
      const startTime = Date.now();
      
      await db.expectCircularReferenceError(async () => {
        await db.updateTeamParent(teamIds[0], teamIds[9]); // Try to make root a child of leaf
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete quickly (under 1 second for 10 levels)
      expect(duration).toBeLessThan(1000);
    }, 5000); // 5 second timeout for this test
  });
});