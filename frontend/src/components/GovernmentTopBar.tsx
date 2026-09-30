import React, { useState } from 'react';
import { NationalEmblem } from './NationalEmblem';
import { ChevronDown } from 'lucide-react';

export const GovernmentTopBar: React.FC = () => {
  const [lang, setLang] = useState<'English' | 'हिन्दी'>('English');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  return (
    <div className="bg-[#0B192C] text-slate-300 text-xs py-1.5 px-4 sm:px-6 lg:px-8 border-b border-slate-800 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Indian National Emblem & Ministries */}
        <div className="flex items-center space-x-3">
          <NationalEmblem className="w-4 h-5 text-white fill-current opacity-95 shrink-0" />
          <span className="text-white font-medium">भारत सरकार</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-200">Government of India</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">रक्षा मंत्रालय</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-300 hidden sm:inline">Ministry of Defence</span>
        </div>

        {/* Right: Accessibility Controls & Language Dropdown */}
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <button className="hover:text-white transition-colors hidden md:inline">
            Skip to Main Content
          </button>
          <span className="text-slate-600 hidden md:inline">|</span>
          <button className="hover:text-white transition-colors hidden sm:inline">
            Screen Reader
          </button>
          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Font Resizing */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setFontSize('sm')}
              className={`px-1 py-0.5 rounded hover:text-white ${fontSize === 'sm' ? 'text-sky-400 font-bold' : ''}`}
              title="Decrease Font"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('base')}
              className={`px-1 py-0.5 rounded hover:text-white ${fontSize === 'base' ? 'text-sky-400 font-bold' : ''}`}
              title="Standard Font"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`px-1 py-0.5 rounded hover:text-white ${fontSize === 'lg' ? 'text-sky-400 font-bold' : ''}`}
              title="Increase Font"
            >
              A+
            </button>
          </div>

          <span className="text-slate-600">|</span>

          {/* Language Selector */}
          <button
            onClick={() => setLang(lang === 'English' ? 'हिन्दी' : 'English')}
            className="flex items-center space-x-1 hover:text-white transition-colors cursor-pointer"
          >
            <span>{lang}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
