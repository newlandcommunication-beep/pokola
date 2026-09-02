import React, { useState } from 'react';
import { 
  Building2, 
  Bell, 
  User, 
  Shield, 
  Briefcase, 
  GraduationCap, 
  LogOut, 
  Menu, 
  X, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  Check, 
  ExternalLink,
  Smartphone,
  Apple
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole, UserProfile } from '../types';
import { INITIAL_STAFF } from '../data/mockData';
import { DeviceMode } from './MobileSimulator';

interface NavbarProps {
  currentView: 'mobile' | 'public' | 'portal' | 'legal';
  setCurrentView: (view: 'mobile' | 'public' | 'portal' | 'legal') => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  activeDevice?: DeviceMode;
  onDeviceChange?: (device: DeviceMode) => void;
  activeStudentTab?: string;
  setActiveStudentTab?: (tab: string) => void;
  activeAdminTab?: string;
  setActiveAdminTab?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuthModal,
  activeDevice = 'ios',
  onDeviceChange,
  activeStudentTab,
  setActiveStudentTab,
  activeAdminTab,
  setActiveAdminTab,
}) => {
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    resetDemoData 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const unreadNotifs = notifications.filter(
    (n) => currentUser && n.userId === currentUser.id && !n.isRead
  );

  const studentsList = allUsers.filter((u) => u.role === 'student');
  const staffList = allUsers.filter((u) => u.role !== 'student');

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3" /> Administrator
          </span>
        );
      case 'loan_officer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Briefcase className="w-3 h-3" /> Loan Officer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <GraduationCap className="w-3 h-3" /> Student
          </span>
        );
    }
  };

  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setCurrentView('portal');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('public')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-700 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-900/20 group-hover:scale-105 transition-transform">
                P
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-700 transition-colors">
                    POKOLA
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                    Lesotho
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
                  Student Loan Assistance & Management
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation for Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('mobile')}
              className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${
                currentView === 'mobile'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Mobile App (iOS & Android)</span>
            </button>

            <button
              onClick={() => setCurrentView('public')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'public'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Web Overview
            </button>

            {currentUser && (
              <button
                onClick={() => setCurrentView('portal')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  currentView === 'portal'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                {currentUser.role === 'student' ? 'Student Portal' : 'Management Portal'}
              </button>
            )}

            <button
              onClick={() => setCurrentView('legal')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'legal'
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Compliance & Terms
            </button>
          </nav>

          {/* Right Action Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Demo Switcher Button */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs"
                title="Switch test accounts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Demo Accounts</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Demo Switcher Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role / Student
                    </span>
                    <button
                      onClick={() => {
                        resetDemoData();
                        setUserDropdownOpen(false);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset Demo
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    <div className="py-1">
                      <div className="px-3 py-1 text-[11px] font-semibold text-purple-900 bg-purple-50/70">
                        Staff & Administration
                      </div>
                      {staffList.map((staff) => (
                        <button
                          key={staff.id}
                          onClick={() => handleSwitchUser(staff)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            currentUser?.id === staff.id ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {staff.fullName[0]}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 leading-tight">
                                {staff.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 capitalize">
                                {staff.role.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                          {currentUser?.id === staff.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="py-1">
                      <div className="px-3 py-1 text-[11px] font-semibold text-blue-900 bg-blue-50/70">
                        Students (Lesotho Universities)
                      </div>
                      {studentsList.slice(0, 5).map((std) => (
                        <button
                          key={std.id}
                          onClick={() => handleSwitchUser(std)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            currentUser?.id === std.id ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              {std.fullName[0]}
                            </div>
                            <div className="max-w-[170px] truncate">
                              <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                                {std.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {std.institution.split('(')[0]}
                              </p>
                            </div>
                          </div>
                          {currentUser?.id === std.id && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 font-semibold">
                          {unreadNotifs.length} new
                        </span>
                      </div>
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications
                        .filter((n) => n.userId === currentUser.id)
                        .slice(0, 8)
                        .map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                              !notif.isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs font-semibold ${!notif.isRead ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                                {notif.title}
                              </p>
                              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))}
                      {notifications.filter((n) => n.userId === currentUser.id).length === 0 && (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('portal')}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {currentUser.fullName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {getRoleBadge(currentUser.role)}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setCurrentUser(null);
                    setCurrentView('public');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="px-3.5 py-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs shadow-blue-700/20 transition-all hover:scale-102"
                >
                  Apply Now
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            <button
              onClick={() => {
                setCurrentView('mobile');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-900 flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>POKOLA Mobile App (iOS / Android)</span>
              </div>
              <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">App Mode</span>
            </button>

            <button
              onClick={() => {
                setCurrentView('public');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Public Home & Loan Calculator
            </button>

            {currentUser && (
              <button
                onClick={() => {
                  setCurrentView('portal');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 flex items-center justify-between"
              >
                <span>{currentUser.role === 'student' ? 'Student Dashboard' : 'Management Portal'}</span>
                {getRoleBadge(currentUser.role)}
              </button>
            )}

            <button
              onClick={() => {
                setCurrentView('legal');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Legal & Responsible Lending
            </button>
          </div>

          {/* Quick Demo Switcher on Mobile */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Switch Test Profiles
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSwitchUser(INITIAL_STAFF[1])}
                className="p-2 text-left rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-xs font-semibold"
              >
                Admin (Dr. Thabo)
              </button>
              <button
                onClick={() => handleSwitchUser(INITIAL_STAFF[0])}
                className="p-2 text-left rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold"
              >
                Officer (Selloane)
              </button>
              <button
                onClick={() => handleSwitchUser(studentsList[0])}
                className="p-2 text-left rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
              >
                Student (Keketso - NUL)
              </button>
              <button
                onClick={() => handleSwitchUser(studentsList[1])}
                className="p-2 text-left rounded-lg bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
              >
                Student (Tshepo - LUCT)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
