'use client';

import { TeamWithMembers } from '@/types';
import Link from 'next/link';

interface TeamCardProps {
  team: TeamWithMembers;
  depth?: number;
}

export default function TeamCard({ team, depth = 0 }: TeamCardProps) {
  const getIndentClass = (depth: number) => {
    switch (depth) {
      case 1: return 'ml-8';
      case 2: return 'ml-16';
      case 3: return 'ml-24';
      case 4: return 'ml-32';
      case 5: return 'ml-40';
      default: return '';
    }
  };
  
  const indentClass = getIndentClass(depth);
  const borderColor = depth > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700 pl-4' : '';

  return (
    <div className={`${indentClass} ${borderColor}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">{team.name}</h3>
              {team.department && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  {team.department}
                </span>
              )}
            </div>
            
            {team.path && (
              <p className="text-sm text-foreground/60 mb-2">Path: {team.path}</p>
            )}
            
            {team.description && (
              <p className="text-foreground/70 mb-3">{team.description}</p>
            )}
          </div>
          
          <Link
            href={`/teams/${team.id}/edit`}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Edit
          </Link>
        </div>
        
        {team.members.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Members ({team.members.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {team.members.map(member => {
                const isInherited = member.id === -1;
                return (
                  <div
                    key={`${member.team_id}-${member.user_id}`}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                      isInherited 
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                        : 'bg-gray-50 dark:bg-gray-700'
                    }
                    ${
                      !member.is_active
                        ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                        : ''
                    }
                    `}
                  >
                    <span className="text-sm text-foreground">{member.user.name}</span>
                    <span className="text-xs text-foreground/60 capitalize">
                      {member.role.replace('_', ' ')}
                    </span>
                    {isInherited && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">(Inherited)</span>
                    )}
                    {!member.is_active && (
                      <span className="text-xs text-red-500">(Inactive)</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {team.children && team.children.length > 0 && (
        <div className="mt-4 space-y-4">
          {team.children.map(childTeam => (
            <TeamCard key={childTeam.id} team={childTeam} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}