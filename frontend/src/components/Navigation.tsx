import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Boxes,
  CheckCircle,
  FileCheck2,
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
  userRole: Role;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', code: '01', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'identity', code: '02', label: 'Identity / DID', icon: Users },
    { id: 'roles', code: '03', label: 'Roles & RBAC', icon: ShieldCheck },
    { id: 'assets', code: '04', label: 'Digital Assets / NFT', icon: Boxes },
    { id: 'verify', code: '05', label: 'Verification', icon: CheckCircle },
    { id: 'audit', code: '06', label: 'Audit Trail', icon: FileCheck2 },
  ];

  return (
    <nav className="bg-[#004B87] border-b border-[#003B6F] shadow-sm select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as NavigationTab)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-t text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-white text-[#004B87] shadow-sm font-bold border-t-2 border-t-amber-400'
                    : 'text-slate-100 hover:bg-[#003866] hover:text-white'
                }`}
              >
                <span className={`text-[10px] font-mono ${isActive ? 'text-[#004B87] font-bold' : 'text-sky-200'}`}>
                  {item.code}.
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#004B87]' : 'text-sky-200'}`} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
