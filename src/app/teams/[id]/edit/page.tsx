import TeamEditForm from '@/components/TeamEditForm';

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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <TeamEditForm teamId={teamId} />
      </div>
    </div>
  );
}