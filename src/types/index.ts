export interface MessagePayload {
  message: string;
}
export type SqlValue = string | number | boolean | null | Date | Buffer;


// User types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

// Team types
export interface Team {
  id: number;
  name: string;
  description: string | null;
  department: string | null;
  parent_id: number | null;
  created_at: Date;
  updated_at: Date;
  path_text: string | null;
}

export interface TeamWithMembers extends Team {
  members: TeamMemberWithUser[];
  children?: TeamWithMembers[];
  path?: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  department?: string;
  parent_id?: number | null;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  department?: string;
  parent_id?: number | null;
}

// Team member types
export interface TeamMember {
  id: number;
  user_id: number;
  team_id: number;
  role: string;
  is_active: boolean;
  joined_at: Date;
  updated_at: Date;
}

export interface TeamMemberWithUser extends TeamMember {
  user: User;
  is_direct?: boolean;
}

export interface CreateTeamMemberInput {
  user_id: number;
  team_id: number;
  role?: string;
  is_active?: boolean;
}

export interface UpdateTeamMemberInput {
  role?: string;
  is_active?: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TeamsHierarchyResponse {
  teams: TeamWithMembers[];
}

// Database query result types
export interface TeamRow {
  id: number;
  name: string;
  description: string | null;
  department: string | null;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
  path_text: string | null;
}

export interface TeamMemberRow {
  id: number;
  user_id: number;
  team_id: number;
  role: string;
  is_active: boolean;
  joined_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
  user_created_at: string;
  user_updated_at: string;
}