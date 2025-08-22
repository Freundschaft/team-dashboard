import {
  CreateTeamInput,
  CreateTeamMemberInput,
  SqlValue,
  Team,
  TeamMemberRow,
  TeamMemberWithUser,
  TeamRow,
  TeamWithMembers,
  UpdateTeamInput,
  UpdateTeamMemberInput,
} from '@/types';
import pool from "./pool";
import {DatabaseError} from "pg";

function rowToTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    department: row.department,
    parent_id: row.parent_id,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    path_text: row.path_text,
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

export async function getValidParentTeams(teamId: number): Promise<Team[]> {
  const query = `
      WITH RECURSIVE
          team_descendants AS (
              -- the chosen team and all its descendants
              SELECT id, parent_id, 0 AS level
              FROM teams
              WHERE id = $1
              UNION ALL
              SELECT t.id, t.parent_id, td.level + 1
              FROM teams t
                       JOIN team_descendants td ON t.parent_id = td.id),
          tree AS (
              -- build full breadcrumbs from roots
              SELECT t.id,
                     t.parent_id,
                     t.name,
                     ARRAY [t.name::text] AS path_arr, -- root carries its own name
                     1                    AS depth
              FROM teams t
              WHERE t.parent_id IS NULL
              UNION ALL
              SELECT c.id,
                     c.parent_id,
                     c.name,
                     tree.path_arr || c.name::text,
                     tree.depth + 1
              FROM teams c
                       JOIN tree ON c.parent_id = tree.id)
      SELECT t.*,
             CASE
                 WHEN tr.parent_id IS NULL THEN tr.name -- empty for roots
                 ELSE array_to_string(tr.path_arr, ' > ') -- e.g. "Root > Child > Grandchild"
                 END AS path_text,
             tr.path_arr,
             tr.depth
      FROM teams t
               JOIN tree tr ON tr.id = t.id
      WHERE t.id <> $1
        AND t.id NOT IN (SELECT id
                         FROM team_descendants
                         WHERE level > 0 -- exclude descendants of $1
      )
      ORDER BY path_text;
  `;

  const result = await pool.query(query, [teamId]);
  return result.rows.map(rowToTeam);
}

export async function getTeamById(id: number): Promise<Team | null> {
  const query = 'SELECT * FROM teams WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rows.length > 0 ? rowToTeam(result.rows[0]) : null;
}

export async function getTeamsWithMembers(): Promise<TeamWithMembers[]> {
  const query = `
      WITH RECURSIVE
-- Build breadcrumbs for the whole forest
tree AS (
    -- roots carry their own name in the path array
    SELECT t.id,
           t.parent_id,
           t.name,
           ARRAY[t.name::text] AS path_arr,
           1 AS depth
    FROM teams t
    WHERE t.parent_id IS NULL

    UNION ALL

    -- children append to the parent's path
    SELECT c.id,
           c.parent_id,
           c.name,
           tree.path_arr || c.name::text,
           tree.depth + 1
    FROM teams c
             JOIN tree ON c.parent_id = tree.id
),

-- Transitive closure of the team tree (ancestor -> descendant)
closure AS (
    SELECT t.id AS ancestor_id, t.id AS descendant_id, 0 AS depth
    FROM teams t
    UNION ALL
    SELECT c.ancestor_id, ch.id, c.depth + 1
    FROM teams ch
             JOIN closure c ON ch.parent_id = c.descendant_id
),

-- Attach members from descendant teams to each ancestor
members_resolved AS (
    SELECT
        c.ancestor_id AS team_id,             -- where member is visible
        tm.user_id,
        CASE WHEN c.depth = 0 THEN tm.id ELSE -1 END AS id,  -- -1 for inherited
        CASE WHEN c.depth = 0 THEN tm.team_id ELSE c.ancestor_id END AS team_id_origin,
        tm.role,
        tm.is_active,
        tm.joined_at,
        tm.updated_at,
        (c.depth = 0) AS is_direct,
        c.depth,
        u.name  AS user_name,
        u.email AS user_email,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at
    FROM closure c
             JOIN team_members tm ON tm.team_id = c.descendant_id
             JOIN users u ON u.id = tm.user_id
),

-- Prefer direct membership; else closest descendant (smallest depth, newest joined_at last tiebreaker)
picked AS (
    SELECT DISTINCT ON (team_id, user_id)
        team_id,
        user_id,
        id,
        team_id_origin,
        role,
        is_active,
        joined_at,
        updated_at,
        is_direct,
        depth,
        user_name,
        user_email,
        user_created_at,
        user_updated_at
    FROM members_resolved
    ORDER BY team_id, user_id, is_direct DESC, depth ASC, joined_at DESC
)

      SELECT
          t.id,
          t.name,
          t.description,
          t.department,
          t.parent_id,
          t.created_at,
          t.updated_at,

          -- derived tree fields
          CASE
              WHEN tr.parent_id IS NULL THEN tr.name
              ELSE array_to_string(tr.path_arr, ' > ')
              END AS path_text,
          tr.path_arr,
          tr.depth,

          -- aggregated members (direct + inherited, with direct preferred)
          COALESCE(
                          jsonb_agg(
                          jsonb_build_object(
                                  'id',               p.id,              -- membership id (or -1 if inherited)
                                  'user_id',          p.user_id,
                                  'team_id',          p.team_id,         -- ancestor where visible
                                  'team_id_origin',   p.team_id_origin,  -- origin of the membership
                                  'role',             p.role,
                                  'is_active',        p.is_active,
                                  'joined_at',        p.joined_at,
                                  'updated_at',       p.updated_at,
                                  'is_direct',        p.is_direct,
                                  'user_name',        p.user_name,
                                  'user_email',       p.user_email,
                                  'user_created_at',  p.user_created_at,
                                  'user_updated_at',  p.user_updated_at
                          )
                          ORDER BY p.is_active DESC, p.is_direct DESC, p.user_name ASC
                                   ) FILTER (WHERE p.user_id IS NOT NULL),
                          '[]'::jsonb
          ) AS members
      FROM teams t
               JOIN tree tr ON tr.id = t.id
               LEFT JOIN picked p ON p.team_id = t.id
      GROUP BY t.id, tr.parent_id, tr.path_arr, tr.depth, tr.name
      ORDER BY path_text, t.name;
  `;

  const result = await pool.query(query);

  return result.rows.map(row => {
    const membersJson = row.members || [];
    const members: TeamMemberWithUser[] = membersJson.map((memberData: {
      id: number;
      user_id: number;
      team_id: number;
      role: string;
      is_active: boolean;
      joined_at: string;
      updated_at: string;
      is_direct: boolean;
      user_name: string;
      user_email: string;
      user_created_at: string;
      user_updated_at: string;
    }) => ({
      id: memberData.id,
      user_id: memberData.user_id,
      team_id: memberData.team_id,
      role: memberData.role,
      is_active: memberData.is_active,
      joined_at: new Date(memberData.joined_at),
      updated_at: new Date(memberData.updated_at),
      is_direct: memberData.is_direct,
      user: {
        id: memberData.user_id,
        name: memberData.user_name,
        email: memberData.user_email,
        created_at: new Date(memberData.user_created_at),
        updated_at: new Date(memberData.user_updated_at)
      }
    }));

    return {
      ...rowToTeam(row),
      members,
      children: []
    };
  });
}

export async function getTeamsHierarchy(): Promise<TeamWithMembers[]> {
  const teamsWithMembers = await getTeamsWithMembers();
  const teamsMap = new Map<number, TeamWithMembers>();
  const rootTeams: TeamWithMembers[] = [];

  // Create map and initialize children arrays
  for (const team of teamsWithMembers) {
    team.children = [];
    teamsMap.set(team.id, team);
  }

  // Build hierarchy by connecting parent-child relationships
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
  const query = `
      INSERT INTO teams (name, description, department, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
  `;
  const values = [input.name, input.description || null, input.department || null, input.parent_id || null];

  try {
    const result = await pool.query(query, values);
    return rowToTeam(result.rows[0]);
  } catch (error) {
    if (error instanceof DatabaseError) {
      // Handle database constraint violations with user-friendly messages
      if (error.message && error.message.includes('circular reference')) {
        throw new Error('Cannot create team: the selected parent would create a circular reference in the team hierarchy');
      }
    }
    // Re-throw other errors as-is
    throw error;
  }
}

export async function updateTeam(id: number, input: UpdateTeamInput): Promise<Team | null> {
  const setParts: string[] = [];
  const values: SqlValue[] = [];
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

  try {
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? rowToTeam(result.rows[0]) : null;
  } catch (error) {
    if (error instanceof DatabaseError) {
      // Handle database constraint violations with user-friendly messages
      if (error.message && error.message.includes('circular reference')) {
        throw new Error('Cannot set parent team: this would create a circular reference in the team hierarchy');
      }
    }
    // Re-throw other errors as-is
    throw error;
  }
}

export async function deleteTeam(id: number): Promise<boolean> {
  const query = 'DELETE FROM teams WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
}

// Team member queries
export async function getTeamMembers(teamId: number): Promise<TeamMemberWithUser[]> {
  const query = `
      SELECT tm.id,
             tm.user_id,
             tm.team_id,
             tm.role,
             tm.is_active,
             tm.joined_at,
             tm.updated_at,
             u.name       as user_name,
             u.email      as user_email,
             u.created_at as user_created_at,
             u.updated_at as user_updated_at
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
      SELECT tm.id,
             tm.user_id,
             tm.team_id,
             tm.role,
             tm.is_active,
             tm.joined_at,
             tm.updated_at,
             u.name       as user_name,
             u.email      as user_email,
             u.created_at as user_created_at,
             u.updated_at as user_updated_at
      FROM team_members tm
               JOIN users u ON tm.user_id = u.id
      WHERE tm.id = $1
  `;
  const memberResult = await pool.query(memberQuery, [result.rows[0].id]);
  return rowToTeamMemberWithUser(memberResult.rows[0]);
}

export async function updateTeamMember(id: number, input: UpdateTeamMemberInput): Promise<TeamMemberWithUser | null> {
  const setParts: string[] = [];
  const values: SqlValue[] = [];
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
      SELECT tm.id,
             tm.user_id,
             tm.team_id,
             tm.role,
             tm.is_active,
             tm.joined_at,
             tm.updated_at,
             u.name       as user_name,
             u.email      as user_email,
             u.created_at as user_created_at,
             u.updated_at as user_updated_at
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