import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './hooks/useWeb3';
import { GovernmentTopBar } from './components/GovernmentTopBar';
import { Header } from './components/Header';
import { Navigation, NavigationTab } from './components/Navigation';
import { DemoSwitcher } from './components/DemoSwitcher';
import { DashboardPage } from './pages/DashboardPage';
import { IdentityPage } from './pages/IdentityPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import { AssetManagementPage } from './pages/AssetManagementPage';
import { VerificationPage } from './pages/VerificationPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const MainContent: React.FC = () => {
  const { role } = useWeb3();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      {/* 1. Official Government of India & Accessibility Top Bar */}
      <GovernmentTopBar />

      {/* 2. Official Bharat Electronics Limited Brand Header */}
      <Header />

      {/* 3. Clean White Navigation Bar with Rounded Tabs */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={role}
      />

      {/* 4. Main Application Screens */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'identity' && <IdentityPage />}
        {activeTab === 'roles' && <RoleManagementPage />}
        {activeTab === 'assets' && <AssetManagementPage onNavigate={setActiveTab} />}
        {activeTab === 'verify' && <VerificationPage />}
        {activeTab === 'audit' && <AuditLogsPage />}
      </main>

      {/* 5. Judge / Evaluator Demo Switcher (Bottom subtle bar) */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <DemoSwitcher />
      </div>

      {/* 6. Clean Enterprise Footer (Matching Reference Screenshot) */}
      <footer className="bg-slate-100 border-t border-slate-200 py-4 text-xs text-slate-500 select-none mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            © 2026 Bharat Electronics Limited (BEL) &nbsp;|&nbsp; Ministry of Defence, Government of India
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
            <a href="#about" className="hover:text-slate-800 transition-colors">About</a>
            <span className="text-slate-300">|</span>
            <a href="#contact" className="hover:text-slate-800 transition-colors">Contact</a>
            <span className="text-slate-300">|</span>
            <a href="#terms" className="hover:text-slate-800 transition-colors">Terms of Use</a>
            <span className="text-slate-300">|</span>
            <a href="#privacy" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <span className="text-slate-300">|</span>
            <a href="#help" className="hover:text-slate-800 transition-colors">Help</a>
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
