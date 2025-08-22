import TeamsHierarchy from '@/components/TeamsHierarchy';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Dashboard</h1>
          <p className="text-foreground/70">Manage your organizational teams and members</p>
        </header>
        
        <main>
          <TeamsHierarchy />
        </main>
      </div>
    </div>
  );
}
