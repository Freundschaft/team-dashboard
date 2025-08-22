import TeamEditForm from '@/components/TeamEditForm';
import { getTeamById, getValidParentTeams, getTeamMembers, getAllUsers } from '@/lib/queries';
import { Team, TeamMemberWithUser, User } from '@/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeamEditPage(props: PageProps) {
  const params = await props.params;
  const teamId = parseInt(params.id);

  if (isNaN(teamId)) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">Invalid Team ID</h3>
            <p className="text-red-600 dark:text-red-300">The team ID provided is not valid.</p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    // Fetch all data in parallel on the server
    const [team, validParents, members, users] = await Promise.all([
      getTeamById(teamId),
      getValidParentTeams(teamId),
      getTeamMembers(teamId),
      getAllUsers()
    ]);

    if (!team) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <TeamEditForm 
            team={team}
            validParents={validParents}
            members={members}
            users={users}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching team data:', error);
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-red-800 dark:text-red-400 font-medium mb-2">Error Loading Team</h3>
            <p className="text-red-600 dark:text-red-300">Failed to load team data. Please try again later.</p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }
}