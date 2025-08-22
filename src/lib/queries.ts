import pool from './db';
import {
  Team,
  TeamWithMembers,
  TeamMember,
  TeamMemberWithUser,
  User,
  CreateTeamInput,
  UpdateTeamInput,
  CreateTeamMemberInput,
  UpdateTeamMemberInput,
  TeamRow,
  TeamMemberRow
} from '@/types';
import { wouldCreateCircularReference } from './team-utils';

// Helper function to convert database row to Team object
function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    department: row.department,
    parent_id: row.parent_id,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  };
}

// Helper function to convert database row to TeamMemberWithUser object
function rowToTeamMemberWithUser(row: TeamMemberRow): TeamMemberWithUser {
  return {
    id: row.id,
    user_id: row.user_id,
    team_id: row.team_id,
    role: row.role,
    is_active: row.is_active,
    joined_at: new Date(row.joined_at),
    updated_at: new Date(row.updated_at),
    user: {
      id: row.user_id,
      name: row.user_name,
      email: row.user_email,
      created_at: new Date(row.user_created_at),
      updated_at: new Date(row.user_updated_at)
    }
  };
}

// Team queries
export async function getAllTeams(): Promise<Team[]> {
  const query = 'SELECT * FROM teams ORDER BY name';
  const result = await pool.query(query);
  return result.rows.map(rowToTeam);
}

export async function getTeamById(id: number): Promise<Team | null> {
  const query = 'SELECT * FROM teams WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? rowToTeam(result.rows[0]) : null;
}

export async function getTeamsWithMembers(): Promise<TeamWithMembers[]> {
  const query = `
    SELECT 
      t.id, t.name, t.description, t.department, t.parent_id, 
      t.created_at, t.updated_at,
      tm.id as member_id, tm.user_id, tm.team_id, tm.role, 
      tm.is_active, tm.joined_at, tm.updated_at as member_updated_at,
      u.name as user_name, u.email as user_email, 
      u.created_at as user_created_at, u.updated_at as user_updated_at
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = true
    LEFT JOIN users u ON tm.user_id = u.id
    ORDER BY t.name, u.name
  `;
  
  const result = await pool.query(query);
  const teamsMap = new Map<number, TeamWithMembers>();
  
  for (const row of result.rows) {
    if (!teamsMap.has(row.id)) {
      teamsMap.set(row.id, {
        ...rowToTeam(row),
        members: [],
        children: []
      });
    }
    
    const team = teamsMap.get(row.id)!;
    if (row.member_id) {
      team.members.push(rowToTeamMemberWithUser(row));
    }
  }
  
  return Array.from(teamsMap.values());
}

export async function getTeamsHierarchy(): Promise<TeamWithMembers[]> {
  const teamsWithMembers = await getTeamsWithMembers();
  const teamsMap = new Map<number, TeamWithMembers>();
  const rootTeams: TeamWithMembers[] = [];
  
  // Create map and add path information
  for (const team of teamsWithMembers) {
    team.children = [];
    teamsMap.set(team.id, team);
  }
  
  // First pass: identify root teams and build basic hierarchy
  for (const team of teamsWithMembers) {
    if (team.parent_id === null) {
      rootTeams.push(team);
    } else {
      const parent = teamsMap.get(team.parent_id);
      if (parent) {
        parent.children!.push(team);
      }
    }
  }
  
  // Second pass: calculate paths recursively
  function calculatePaths(teams: TeamWithMembers[], parentPath = '') {
    teams.forEach(team => {
      // Only set path if there's a parent (avoid redundant "Path: TeamName" for root teams)
      team.path = parentPath ? `${parentPath} > ${team.name}` : undefined;
      if (team.children && team.children.length > 0) {
        calculatePaths(team.children, parentPath || team.name);
      }
    });
  }
  
  calculatePaths(rootTeams);
  
  // Function to collect all members from a team and its descendants
  function collectAllMembers(team: TeamWithMembers): TeamMemberWithUser[] {
    const allMembers = new Map<string, TeamMemberWithUser>();
    
    // Add direct members
    team.members.forEach(member => {
      const key = `${member.user_id}`;
      allMembers.set(key, member);
    });
    
    // Recursively add members from child teams
    if (team.children) {
      team.children.forEach(child => {
        const childMembers = collectAllMembers(child);
        childMembers.forEach(member => {
          const key = `${member.user_id}`;
          // Only add if user is not already a member (direct membership takes precedence)
          if (!allMembers.has(key)) {
            allMembers.set(key, {
              ...member,
              // Create a virtual membership record for inherited members
              id: -1, // Use negative ID to indicate inherited membership
              team_id: team.id,
              role: member.role, // Keep original role from child team
            });
          }
        });
      });
    }
    
    return Array.from(allMembers.values());
  }
  
  // Update each team with inherited members
  teamsMap.forEach(team => {
    team.members = collectAllMembers(team);
  });
  
  // Sort children recursively
  function sortChildren(teams: TeamWithMembers[]): void {
    teams.sort((a, b) => a.name.localeCompare(b.name));
    teams.forEach(team => {
      if (team.children && team.children.length > 0) {
        sortChildren(team.children);
      }
    });
  }
  
  sortChildren(rootTeams);
  return rootTeams;
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  // For new teams, we just need to make sure the parent exists if specified
  // No circular reference check needed since this is a new team
  const query = `
    INSERT INTO teams (name, description, department, parent_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [input.name, input.description || null, input.department || null, input.parent_id || null];
  const result = await pool.query(query, values);
  return rowToTeam(result.rows[0]);
}

export async function updateTeam(id: number, input: UpdateTeamInput): Promise<Team | null> {
  // Check for circular reference if parent_id is being updated
  if (input.parent_id !== undefined && input.parent_id !== null) {
    const teams = await getAllTeams();
    const wouldCreateCircle = wouldCreateCircularReference(id, input.parent_id, teams);
    if (wouldCreateCircle) {
      throw new Error('Cannot set parent: would create circular reference');
    }
  }

  const setParts: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (input.name !== undefined) {
    setParts.push(`name = $${paramCount++}`);
    values.push(input.name);
  }
  if (input.description !== undefined) {
    setParts.push(`description = $${paramCount++}`);
    values.push(input.description);
  }
  if (input.department !== undefined) {
    setParts.push(`department = $${paramCount++}`);
    values.push(input.department);
  }
  if (input.parent_id !== undefined) {
    setParts.push(`parent_id = $${paramCount++}`);
    values.push(input.parent_id);
  }
  
  if (setParts.length === 0) {
    return await getTeamById(id);
  }
  
  values.push(id);
  const query = `
    UPDATE teams 
    SET ${setParts.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  return result.rows.length > 0 ? rowToTeam(result.rows[0]) : null;
}

export async function deleteTeam(id: number): Promise<boolean> {
  const query = 'DELETE FROM teams WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Team member queries
export async function getTeamMembers(teamId: number): Promise<TeamMemberWithUser[]> {
  const query = `
    SELECT 
      tm.id, tm.user_id, tm.team_id, tm.role, tm.is_active, 
      tm.joined_at, tm.updated_at,
      u.name as user_name, u.email as user_email,
      u.created_at as user_created_at, u.updated_at as user_updated_at
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.team_id = $1
    ORDER BY u.name
  `;
  
  const result = await pool.query(query, [teamId]);
  return result.rows.map(rowToTeamMemberWithUser);
}

export async function addTeamMember(input: CreateTeamMemberInput): Promise<TeamMemberWithUser> {
  const query = `
    INSERT INTO team_members (user_id, team_id, role, is_active)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [input.user_id, input.team_id, input.role || 'member', input.is_active !== false];
  const result = await pool.query(query, values);
  
  // Get the full member with user info
  const memberQuery = `
    SELECT 
      tm.id, tm.user_id, tm.team_id, tm.role, tm.is_active, 
      tm.joined_at, tm.updated_at,
      u.name as user_name, u.email as user_email,
      u.created_at as user_created_at, u.updated_at as user_updated_at
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.id = $1
  `;
  const memberResult = await pool.query(memberQuery, [result.rows[0].id]);
  return rowToTeamMemberWithUser(memberResult.rows[0]);
}

export async function updateTeamMember(id: number, input: UpdateTeamMemberInput): Promise<TeamMemberWithUser | null> {
  const setParts: string[] = [];
  const values: any[] = [];
  let paramCount = 1;
  
  if (input.role !== undefined) {
    setParts.push(`role = $${paramCount++}`);
    values.push(input.role);
  }
  if (input.is_active !== undefined) {
    setParts.push(`is_active = $${paramCount++}`);
    values.push(input.is_active);
  }
  
  if (setParts.length === 0) {
    return null;
  }
  
  values.push(id);
  const query = `
    UPDATE team_members 
    SET ${setParts.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `;
  
  const result = await pool.query(query, values);
  if (result.rows.length === 0) return null;
  
  // Get the full member with user info
  const memberQuery = `
    SELECT 
      tm.id, tm.user_id, tm.team_id, tm.role, tm.is_active, 
      tm.joined_at, tm.updated_at,
      u.name as user_name, u.email as user_email,
      u.created_at as user_created_at, u.updated_at as user_updated_at
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    WHERE tm.id = $1
  `;
  const memberResult = await pool.query(memberQuery, [result.rows[0].id]);
  return rowToTeamMemberWithUser(memberResult.rows[0]);
}

export async function removeTeamMember(id: number): Promise<boolean> {
  const query = 'DELETE FROM team_members WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

// User queries
export async function getAllUsers(): Promise<User[]> {
  const query = 'SELECT * FROM users ORDER BY name';
  const result = await pool.query(query);
  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at)
  }));
}