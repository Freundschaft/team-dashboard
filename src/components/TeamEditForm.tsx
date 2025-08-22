'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team, TeamMemberWithUser, UpdateTeamInput, User } from '@/types';
import Link from 'next/link';
import MemberManagement from './MemberManagement';

interface TeamEditFormProps {
  team: Team;
  validParents: Team[];
  members: TeamMemberWithUser[];
  users: User[];
}

export default function TeamEditForm({ team, validParents, members: initialMembers, users }: TeamEditFormProps) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMemberWithUser[]>(initialMembers);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: team.name,
    description: team.description || '',
    department: team.department || '',
    parent_id: team.parent_id
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const updateData: UpdateTeamInput = {
        name: formData.name,
        description: formData.description,
        department: formData.department,
        parent_id: formData.parent_id
      };
      
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to update team');
      }
    } catch (err) {
      setError(`Failed to update team ${err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSaving(true);
      
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/');
      } else {
        setError(data.error || 'Failed to delete team');
      }
    } catch (err) {
      setError(`Failed to delete team ${err}`);
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Edit Team</h1>
          <p className="text-foreground/70">Update team information and manage members</p>
        </div>
        <Link
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Teams
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Team Details</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-foreground mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="parent_id" className="block text-sm font-medium text-foreground mb-1">
                  Parent Team
                </label>
                <select
                  id="parent_id"
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    parent_id: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No parent team</option>
                  {validParents.map(parentTeam => (
                    <option key={parentTeam.id} value={parentTeam.id}>
                      {parentTeam.path_text ?? parentTeam.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Team
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <MemberManagement teamId={team.id} members={members} users={users} onMembersChange={setMembers} />
        </div>
      </div>
    </div>
  );
}