import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user, role, switchRole, logout, resetAllDemoData } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top micro-bar: Indian Legal Compliance & Role Switcher */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800 flex flex-wrap justify-between items-center text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium tracking-wide">
            Bar Council of India (BCI) Rule 36 Compliant Directory
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-amber-400 font-medium">
            DPDPA 2023 Privileged Data Protection
          </span>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
          <span className="text-slate-400 font-medium">Active Persona:</span>
          <div className="inline-flex rounded-md shadow-sm bg-slate-900 p-0.5 border border-slate-700">
            {(['client', 'advocate', 'admin'] as UserRole[]).map((r) => {
              const isActive = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded capitalize transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <button
            onClick={resetAllDemoData}
            title="Reset Mock Database to Initial State"
            className="text-xs text-slate-400 hover:text-amber-400 underline ml-2"
          >
            Reset Demo
          </button>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Platform Name */}
          <button
            type="button"
            className="flex items-center space-x-3 cursor-pointer select-none text-left focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg"
            onClick={() => setActiveTab('intake')}
            aria-label="Go to Case Intake Wizard"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-serif">
                  LEGAL<span className="text-amber-500">CONNECT</span>
                </span>
                <span className="text-xs bg-amber-500/20 text-amber-400 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30">
                  INDIA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Ethical Digital Legal Gateway & Workspace
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('intake')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'intake'
                  ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              Case Intake Wizard
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'directory'
                  ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              Advocate Directory
            </button>
            <button
              onClick={() => setActiveTab('workspaces')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'workspaces'
                  ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              Case Workspaces
            </button>

            {/* Role specific portals */}
            {role === 'advocate' && (
              <button
                onClick={() => setActiveTab('advocate-dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'advocate-dashboard'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                    : 'text-emerald-400 hover:bg-slate-800/60 hover:text-emerald-300'
                }`}
              >
                Advocate Portal
              </button>
            )}

            {role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin-portal')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'admin-portal'
                    ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500'
                    : 'text-rose-400 hover:bg-slate-800/60 hover:text-rose-300'
                }`}
              >
                Admin Verification Queue
              </button>
            )}
          </nav>

          {/* User Account / Identity Section */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white">{user.full_name}</div>
                  <div className="text-[10px] text-amber-400 capitalize font-medium">
                    {user.role === 'advocate' ? 'Enrolled Advocate' : user.role === 'admin' ? 'BCI Compliance Officer' : 'Verified Client'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-amber-300">
                  {user.full_name.charAt(0)}
                </div>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm shadow transition-colors"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden bg-slate-950 border-t border-slate-800 px-4 py-2 flex justify-around text-xs">
        <button
          onClick={() => setActiveTab('intake')}
          className={`py-1 font-medium ${activeTab === 'intake' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          Intake Wizard
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-1 font-medium ${activeTab === 'directory' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          Advocates
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`py-1 font-medium ${activeTab === 'workspaces' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          Workspaces
        </button>
        {role === 'advocate' && (
          <button
            onClick={() => setActiveTab('advocate-dashboard')}
            className={`py-1 font-medium ${activeTab === 'advocate-dashboard' ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
        )}
        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin-portal')}
            className={`py-1 font-medium ${activeTab === 'admin-portal' ? 'text-rose-400' : 'text-slate-400'}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
