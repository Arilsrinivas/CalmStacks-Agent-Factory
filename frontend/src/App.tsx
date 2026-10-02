import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CaseIntakeWizard } from './components/CaseIntakeWizard';
import { AdvocateDirectory } from './components/AdvocateDirectory';
import { CaseWorkspace } from './components/CaseWorkspace';
import { AdvocateDashboard } from './components/AdvocateDashboard';
import { AdminPortal } from './components/AdminPortal';
import { AuthModal } from './components/AuthModal';
import { AIIntakeSummaryRecord } from './types';

const MainLayout: React.FC = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('intake');
  const [currentIntakeSummary, setCurrentIntakeSummary] = useState<AIIntakeSummaryRecord | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(undefined);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Flow handlers
  const handleIntakeCompleted = (summary: AIIntakeSummaryRecord) => {
    setCurrentIntakeSummary(summary);
    setActiveTab('directory');
  };

  const handleNavigateToWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setActiveTab('workspaces');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="flex-1">
        {activeTab === 'intake' && (
          <CaseIntakeWizard onIntakeCompleted={handleIntakeCompleted} />
        )}

        {activeTab === 'directory' && (
          <AdvocateDirectory
            intakeSummary={currentIntakeSummary}
            onNavigateToWorkspace={handleNavigateToWorkspace}
          />
        )}

        {activeTab === 'workspaces' && (
          <CaseWorkspace initialWorkspaceId={selectedWorkspaceId} />
        )}

        {activeTab === 'advocate-dashboard' && (
          <AdvocateDashboard onNavigateToWorkspace={handleNavigateToWorkspace} />
        )}

        {activeTab === 'admin-portal' && <AdminPortal />}
      </main>

      <Footer />

      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;
