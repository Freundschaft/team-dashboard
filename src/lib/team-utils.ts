import { Team, TeamWithMembers } from '@/types';

/**
 * Flattens a hierarchical team structure into a flat array
 */
export function flattenTeams(teamsList: TeamWithMembers[]): Team[] {
  const result: Team[] = [];
  
  const flatten = (teams: TeamWithMembers[]) => {
    teams.forEach(team => {
      result.push({
        id: team.id,
        name: team.name,
        description: team.description,
        department: team.department,
        parent_id: team.parent_id,
        created_at: team.created_at,
        updated_at: team.updated_at
      });
      
      if (team.children && team.children.length > 0) {
        flatten(team.children);
      }
    });
  };
  
  flatten(teamsList);
  return result;
}

/**
 * Gets all descendant team IDs for a given team
 */
export function getDescendantIds(teamId: number, teamsList: TeamWithMembers[]): number[] {
  const descendants: number[] = [];
  
  const findDescendants = (teams: TeamWithMembers[]) => {
    teams.forEach(team => {
      if (team.id === teamId) {
        // Found the team, collect all its descendants
        const collectDescendants = (children: TeamWithMembers[]) => {
          children.forEach((child: TeamWithMembers) => {
            descendants.push(child.id);
            if (child.children && child.children.length > 0) {
              collectDescendants(child.children);
            }
          });
        };
        
        if (team.children && team.children.length > 0) {
          collectDescendants(team.children);
        }
      } else if (team.children && team.children.length > 0) {
        findDescendants(team.children);
      }
    });
  };
  
  findDescendants(teamsList);
  return descendants;
}

/**
 * Gets all descendant team IDs from a flat team array
 */
export function getDescendantIdsFromFlat(teamId: number, teams: Team[]): number[] {
  const descendants: number[] = [];
  
  const findChildren = (parentId: number) => {
    const children = teams.filter(team => team.parent_id === parentId);
    children.forEach(child => {
      descendants.push(child.id);
      findChildren(child.id); // Recursively find grandchildren
    });
  };
  
  findChildren(teamId);
  return descendants;
}

/**
 * Checks if setting a parent would create a circular reference
 */
export function wouldCreateCircularReference(teamId: number, parentId: number, teams: Team[]): boolean {
  if (teamId === parentId) return true;
  
  // Check if the proposed parent is actually a descendant of the team
  const descendants = getDescendantIdsFromFlat(teamId, teams);
  return descendants.includes(parentId);
}

/**
 * Filters teams to exclude invalid parent options (self and descendants)
 */
export function getValidParentTeams(teamId: number, teams: Team[], hierarchicalTeams?: TeamWithMembers[]): Team[] {
  let descendantIds: number[];
  
  if (hierarchicalTeams) {
    // Use hierarchical structure if available (more efficient)
    descendantIds = getDescendantIds(teamId, hierarchicalTeams);
  } else {
    // Fall back to flat structure
    descendantIds = getDescendantIdsFromFlat(teamId, teams);
  }
  
  return teams.filter(team => 
    team.id !== teamId && !descendantIds.includes(team.id)
  );
}