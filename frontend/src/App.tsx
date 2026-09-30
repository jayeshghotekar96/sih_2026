import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './hooks/useWeb3';
import { GovernmentTopBar } from './components/GovernmentTopBar';
import { Header } from './components/Header';
import { Navigation, NavigationTab } from './components/Navigation';
import { FlashNewsBar } from './components/FlashNewsBar';
import { NetworkBanner } from './components/NetworkBanner';
import { DemoSwitcher } from './components/DemoSwitcher';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityPage } from './pages/IdentityPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { AssetManagementPage } from './pages/AssetManagementPage';
import { VerificationPage } from './pages/VerificationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { Shield, ExternalLink, CheckCircle } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role } = useWeb3();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* 1. Official Government of India & Accessibility Top Bar */}
      <GovernmentTopBar />

      {/* 2. Official Bharat Electronics Limited Brand Header */}
      <Header />

      {/* 3. BEL Corporate Blue Navigation Bar (6 Primary Modules) */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={role}
      />

      {/* 4. Live Flash News Banner (modeled after BEL homepage) */}
      <FlashNewsBar />

      {/* 5. Network Warning Banner if disconnected or wrong chain */}
      <NetworkBanner />

      {/* 6. Quick Demo Account / Persona Bar */}
      <DemoSwitcher />

      {/* 7. Main Application Screens */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'identity' && <IdentityPage />}
        {activeTab === 'roles' && <RoleManagementPage />}
        {activeTab === 'assets' && <AssetManagementPage onNavigate={setActiveTab} />}
        {activeTab === 'verify' && <VerificationPage />}
        {activeTab === 'audit' && <AuditLogsPage />}
      </main>

      {/* 8. Official BEL Corporate & SIH Footer */}
      <footer className="bg-[#002D54] text-slate-200 border-t-4 border-amber-400 py-6 text-xs mt-auto select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
            <span className="font-bold text-white tracking-wide text-sm">
              भारत इलेक्ट्रॉनिक्स लिमिटेड / Bharat Electronics Limited
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-slate-300">
              A Navratna PSU under Ministry of Defence, Government of India
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-slate-300 text-xs">
            <span className="text-amber-300 font-semibold">
              SIH 2026 Problem Statement SIH26125
            </span>
            <span>•</span>
            <span>DecentraX Security Architecture</span>
            <span>•</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Polygon Amoy Testnet (80002)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Web3Provider>
      <MainContent />
    </Web3Provider>
  );
};

export default App;
