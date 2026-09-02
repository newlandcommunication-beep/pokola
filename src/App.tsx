import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { LandingPage } from './components/LandingPage';
import { StudentPortal } from './components/StudentPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { LegalModals } from './components/LegalModals';
import { MobileSimulator, DeviceMode } from './components/MobileSimulator';
import { MobileAppView } from './components/MobileAppView';

const MainLayout: React.FC = () => {
  const { currentUser, toastMessage } = useApp();

  const [currentView, setCurrentView] = useState<'mobile' | 'public' | 'portal' | 'legal'>('mobile');
  const [activeDevice, setActiveDevice] = useState<DeviceMode>('ios');
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [legalInitialTab, setLegalInitialTab] = useState<string>('responsible');

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenLegal = (tab: string = 'responsible') => {
    setLegalInitialTab(tab);
    setCurrentView('legal');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans antialiased selection:bg-blue-200 selection:text-blue-900">
      
      {/* Top Navigation Bar with iOS / Android Mobile Toggle */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenAuthModal={handleOpenAuth}
        activeDevice={activeDevice}
        onDeviceChange={setActiveDevice}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col">
        {currentView === 'mobile' && (
          <MobileSimulator
            activeDevice={activeDevice}
            onDeviceChange={setActiveDevice}
            appName="POKOLA Mobile"
          >
            <MobileAppView
              deviceMode={activeDevice}
              onOpenAuth={handleOpenAuth}
            />
          </MobileSimulator>
        )}

        {currentView === 'public' && (
          <LandingPage
            onOpenAuth={handleOpenAuth}
            onNavigatePortal={() => setCurrentView('portal')}
            onOpenLegal={handleOpenLegal}
          />
        )}

        {currentView === 'portal' && (
          <>
            {currentUser?.role === 'student' ? (
              <StudentPortal />
            ) : (
              <AdminDashboard />
            )}
          </>
        )}

        {currentView === 'legal' && (
          <LegalModals
            initialTab={legalInitialTab}
            onNavigateHome={() => setCurrentView('public')}
            onNavigatePortal={() => setCurrentView('portal')}
          />
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
          setCurrentView('mobile');
        }}
      />

      {/* Global Toast Feedback */}
      <Toast toast={toastMessage} />

    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
