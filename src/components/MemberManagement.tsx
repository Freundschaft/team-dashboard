'use client';

import { useState, useEffect } from 'react';
import { User, TeamMemberWithUser, CreateTeamMemberInput, UpdateTeamMemberInput } from '@/types';

interface MemberManagementProps {
  teamId: number;
  members: TeamMemberWithUser[];
  onMembersChange: (members: TeamMemberWithUser[]) => void;
}

export default function MemberManagement({ teamId, members, onMembersChange }: MemberManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newMember, setNewMember] = useState({
    user_id: '',
    role: 'member'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.user_id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const memberData: CreateTeamMemberInput = {
        user_id: parseInt(newMember.user_id),
        team_id: teamId,
        role: newMember.role,
        is_active: true
      };
      
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onMembersChange([...members, data.data]);
        setNewMember({ user_id: '', role: 'member' });
        setShowAddForm(false);
      } else {
        setError(data.error || 'Failed to add member');
      }
    } catch (err) {
      setError(`Failed to add member ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (memberId: number, updates: UpdateTeamMemberInput) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (data.success) {
        onMembersChange(members.map(member => 
          member.id === memberId ? data.data : member
        ));
      } else {
        setError(data.error || 'Failed to update member');
      }
    } catch (err) {
      setError(`Failed to update member: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        onMembersChange(members.filter(member => member.id !== memberId));
      } else {
        setError(data.error || 'Failed to remove member');
      }
    } catch (err) {
      setError(`Failed to remove member ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = users.filter(user => 
    !members.some(member => member.user_id === user.id)
  );

  const roles = [
    { value: 'member', label: 'Member' },
    { value: 'senior_engineer', label: 'Senior Engineer' },
    { value: 'lead', label: 'Lead' },
    { value: 'manager', label: 'Manager' },
    { value: 'senior_sales', label: 'Senior Sales' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-foreground">Direct Team Members</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Member'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMember} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-3">Add New Member</h3>
          
          <div className="space-y-3">
            <div>
              <label htmlFor="user_select" className="block text-sm font-medium text-foreground mb-1">
                User
              </label>
              <select
                id="user_select"
                required
                value={newMember.user_id}
                onChange={(e) => setNewMember(prev => ({ ...prev, user_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user</option>
                {availableUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="role_select" className="block text-sm font-medium text-foreground mb-1">
                Role
              </label>
              <select
                id="role_select"
                value={newMember.role}
                onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !newMember.user_id}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {members.length === 0 ? (
          <p className="text-foreground/70 text-center py-4">No members in this team</p>
        ) : (
          members.map(member => (
            <div key={member.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-col gap-3">
                <div className="flex-1 min-w-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{member.user.name}</span>
                      {!member.is_active && (
                        <span className="text-xs text-red-500 bg-red-100 dark:bg-red-900 px-2 py-1 rounded whitespace-nowrap">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-foreground/60">{member.user.email}</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-foreground/60">Role:</span>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMember(member.id, { role: e.target.value })}
                      disabled={loading}
                      className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => handleUpdateMember(member.id, { is_active: !member.is_active })}
                    disabled={loading}
                    className={`px-3 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                      member.is_active
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
                        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}
                  >
                    {member.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={loading}
                    className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}