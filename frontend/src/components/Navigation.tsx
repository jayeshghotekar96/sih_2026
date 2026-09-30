import React from 'react';
import {
  Home,
  User,
  Shield,
  Layers,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { Role } from '../types';

export type NavigationTab = 
  | 'dashboard'
  | 'identity'
  | 'roles'
  | 'assets'
  | 'verify'
  | 'audit';

interface NavigationProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  userRole?: Role;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'identity', label: 'Identity / DID', icon: User },
    { id: 'roles', label: 'Access Control', icon: Shield },
    { id: 'assets', label: 'Digital Assets / NFT', icon: Layers },
    { id: 'verify', label: 'Verification', icon: CheckCircle2 },
    { id: 'audit', label: 'Audit Trail', icon: FileText },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 sm:space-x-3 overflow-x-auto py-2.5 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavigationTab)}
                className={`flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#EBF3FC] text-[#0052CC] font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#0052CC]' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
