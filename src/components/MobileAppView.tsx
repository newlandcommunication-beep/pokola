import React, { useState } from 'react';
import { 
  Home, 
  PlusCircle, 
  CreditCard, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Smartphone, 
  Calendar, 
  DollarSign, 
  FileText, 
  Send, 
  ChevronRight, 
  Building2, 
  LogOut,
  Bell,
  BellRing,
  RefreshCw,
  PhoneCall,
  ExternalLink,
  ChevronDown,
  WifiOff,
  Database,
  Calculator,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Radio,
  Trash2,
  CheckCheck,
  X,
  Play,
  Camera
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Loan, LoanApplication, Repayment } from '../types';
import { formatMaloti, calculateLoan, evaluateEligibility, formatPercent } from '../utils/loanEngine';
import { MobileLoanCalculator } from './MobileLoanCalculator';
import { MobileFAQs } from './MobileFAQs';
import { LoanStatusTracker } from './LoanStatusTracker';
import { MobileAiChatbot } from './MobileAiChatbot';
import { CameraCaptureModal } from './CameraCaptureModal';

interface MobileAppViewProps {
  deviceMode: 'ios' | 'android';
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const MobileAppView: React.FC<MobileAppViewProps> = ({
  deviceMode,
  onOpenAuth
}) => {
  const { 
    currentUser, 
    setCurrentUser,
    updateUserProfile,
    loans, 
    applications, 
    repayments, 
    settings, 
    notifications,
    announcements,
    pushPreferences,
    submitLoanApplication, 
    acceptLoanAgreement, 
    recordRepayment, 
    requestPushPermission,
    updatePushPreferences,
    simulateTestPushNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    createSupportTicket, 
    replyToSupportTicket, 
    supportTickets,
    allUsers,
    isOnline,
    isOfflinePersistenceEnabled,
    isDarkMode,
    toggleDarkMode
  } = useApp();

  // Mobile Bottom Navigation Tabs
  const [mobileTab, setMobileTab] = useState<'home' | 'calc' | 'apply' | 'repay' | 'activity' | 'ai' | 'account' | 'faqs'>('home');

  // Push Notification Modal & Filtering State
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'loan_status' | 'repayment_reminder' | 'announcement'>('all');

  // Application Flow State
  const [applyAmount, setApplyAmount] = useState<number>(600);
  const [applyPurpose, setApplyPurpose] = useState<string>('Textbooks and academic course materials');
  const [applyRepaymentModel, setApplyRepaymentModel] = useState<'one_month' | 'bi_weekly'>('one_month');
  const [applyStep, setApplyStep] = useState<number>(1);

  // Repayment Flow State
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'mpesa' | 'ecocash' | 'bank_transfer'>('mpesa');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Loan Agreement Acceptance modal state
  const [agreementModalApp, setAgreementModalApp] = useState<LoanApplication | null>(null);
  const [agreementSignedName, setAgreementSignedName] = useState<string>(currentUser?.fullName || '');
  const [agreementAcknowledged, setAgreementAcknowledged] = useState<boolean>(false);

  // Camera Profile Photo modal state
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  // Support Ticket state
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');
  const [ticketSuccess, setTicketSuccess] = useState<boolean>(false);

  // Calculations for current student
  const studentLoans = currentUser ? loans.filter((l) => l.studentId === currentUser.id) : [];
  const activeLoan = studentLoans.find(
    (l) => l.status === 'active' || l.status === 'partially_paid' || l.status === 'approved' || l.status === 'overdue'
  );
  const myApplications = currentUser ? applications.filter((a) => a.studentId === currentUser.id) : [];
  const approvedPendingAgreement = myApplications.find((a) => a.status === 'approved' && !a.isAgreementSigned);
  const myRepayments = currentUser ? repayments.filter((r) => r.studentId === currentUser.id) : [];

  // Filtered notifications for current student
  const myNotifications = currentUser ? notifications.filter((n) => n.userId === currentUser.id) : [];
  const unreadNotifCount = myNotifications.filter((n) => !n.isRead).length;

  const displayNotifications = myNotifications.filter((n) => {
    if (notifFilter === 'all') return true;
    if (notifFilter === 'loan_status') return n.category === 'loan_status';
    if (notifFilter === 'repayment_reminder') return n.category === 'repayment_reminder' || n.category === 'overdue_alert';
    if (notifFilter === 'announcement') return n.category === 'announcement' || n.category === 'policy_update';
    return true;
  });

  const eligibilityCheck = currentUser
    ? evaluateEligibility(currentUser, loans, applyAmount, settings)
    : { isEligible: false, checks: [], reason: 'Please sign in to check eligibility.' };

  const currentCalc = calculateLoan(
    applyAmount,
    settings.monthlyInterestRate,
    settings.repaymentPeriodDays,
    applyRepaymentModel
  );

  // Handlers
  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }
    const res = submitLoanApplication(applyAmount, applyPurpose, applyRepaymentModel);
    if (res.success) {
      setApplyStep(1);
      setMobileTab('home');
    }
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;
    const res = recordRepayment({
      loanId: activeLoan.id,
      amount: Number(payAmount) || activeLoan.balance,
      paymentMethod: payMethod,
      transactionReference: payRef.trim() || `MP-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: payNotes,
    });
    if (res.success) {
      setPayRef('');
      setPayNotes('');
      setMobileTab('home');
    }
  };

  const handleAgreementAccept = () => {
    if (!agreementModalApp) return;
    acceptLoanAgreement(agreementModalApp.id, agreementSignedName);
    setAgreementModalApp(null);
    setMobileTab('home');
  };

  return (
    <div className={`flex-1 flex flex-col h-full select-none pb-20 transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Mobile Top App Bar */}
      <header className={`sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between shadow-2xs backdrop-blur-md transition-colors ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-800 text-white' 
          : 'bg-white/95 border-slate-200/80 text-slate-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            P
          </div>
          <div>
            <span className={`text-sm font-black tracking-tight block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>POKOLA</span>
            <span className={`text-[10px] font-semibold tracking-wide ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>LESOTHO MOBILE</span>
          </div>
        </div>

        {/* Quick User / Auth Badge, Dark Mode Toggle & Connectivity Status */}
        <div className="flex items-center gap-1.5">
          {/* Push Notification Bell */}
          <button
            type="button"
            onClick={() => setShowNotificationsModal(true)}
            title="Push Notification Alerts"
            aria-label="Open Notifications Center"
            className={`relative p-1.5 rounded-full border transition-all ${
              isDarkMode 
                ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {unreadNotifCount > 0 ? (
              <BellRing className="w-4 h-4 text-amber-500 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Dark Mode Theme Toggle */}
          <button
            type="button"
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Theme"
            className={`p-1.5 rounded-full border transition-all ${
              isDarkMode 
                ? 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-blue-900" />
            )}
          </button>

          {!isOnline && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
              <WifiOff className="w-3 h-3 text-amber-600" />
              Offline
            </span>
          )}

          {currentUser ? (
            <button 
              onClick={() => setMobileTab('account')}
              className={`flex items-center gap-2 py-1 px-2.5 rounded-full text-xs font-bold transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-5 h-5 rounded-full object-cover border border-blue-400"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {currentUser.fullName.charAt(0)}
                </div>
              )}
              <span className="truncate max-w-[80px] text-[11px]">{currentUser.fullName.split(' ')[0]}</span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Intermittent Connectivity / Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-3.5 py-2 text-xs flex items-center justify-between border-b border-amber-600 shadow-2xs">
          <div className="flex items-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            <span>Offline Mode: Loan status & records cached via Firestore</span>
          </div>
          <span className="bg-amber-700/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Cached</span>
        </div>
      )}

      {/* Main Content Area Based on Active Tab */}
      <main className="flex-1 p-4 space-y-4 overflow-y-auto">
        
        {/* ================= TAB 1: HOME ================= */}
        {mobileTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Agreement Pending Banner */}
            {approvedPendingAgreement && (
              <div className="bg-amber-500 text-white p-3.5 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Agreement Ready to Sign</span>
                </div>
                <p className="text-xs text-amber-50">
                  Loan of <strong>{formatMaloti(approvedPendingAgreement.requestedAmount)}</strong> was approved. Tap below to sign digitally and receive funds.
                </p>
                <button
                  onClick={() => setAgreementModalApp(approvedPendingAgreement)}
                  className="w-full py-2 bg-white text-amber-900 rounded-xl text-xs font-black shadow-xs hover:bg-amber-50 transition-colors"
                >
                  Review & Sign Loan Agreement
                </button>
              </div>
            )}

            {/* Loan Status Tracker Widget with Circular Progress Bar */}
            <LoanStatusTracker
              loan={activeLoan}
              allStudentLoans={studentLoans}
              repayments={myRepayments}
              onPayNow={(loanToPay, amt) => {
                setPayAmount(amt);
                setMobileTab('repay');
              }}
              onViewStatement={() => setMobileTab('activity')}
              onApplyNew={() => setMobileTab('apply')}
              onOpenCalculator={() => setMobileTab('calc')}
            />

            {/* Quick Action Grid */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMobileTab('calc')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs group ${
                  isDarkMode 
                    ? 'bg-slate-900 border-blue-900/60 hover:border-blue-500 text-white' 
                    : 'bg-white border-blue-200 hover:border-blue-400 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform ${
                  isDarkMode ? 'bg-blue-950 text-blue-300' : 'bg-blue-100 text-blue-900'
                }`}>
                  <Calculator className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Calculator</span>
                  <span className={`text-[9px] font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Amortize</span>
                </div>
              </button>

              <button
                onClick={() => setMobileTab('apply')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-900'
                }`}>
                  <PlusCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Apply</span>
                  <span className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Up to M1,500</span>
                </div>
              </button>

              <button
                onClick={() => setMobileTab('faqs')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-amber-950/80 text-amber-300' : 'bg-amber-50 text-amber-800'
                }`}>
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>FAQs</span>
                  <span className={`text-[9px] font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>25% & Criteria</span>
                </div>
              </button>

              <button
                onClick={() => setMobileTab('repay')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-emerald-950/80 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>M-Pesa Pay</span>
                  <span className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>882910</span>
                </div>
              </button>

              <button
                onClick={() => setMobileTab('ai')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200 hover:border-purple-300 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-purple-950/80 text-purple-300' : 'bg-purple-50 text-purple-700'
                }`}>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>POKOLA AI</span>
                  <span className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Advisor</span>
                </div>
              </button>

              <button
                onClick={() => setMobileTab('account')}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-24 shadow-2xs ${
                  isDarkMode 
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-white' 
                    : 'bg-white border-slate-200 hover:border-blue-300 text-slate-900'
                }`}
              >
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}>
                  <PhoneCall className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Support</span>
                  <span className={`text-[9px] ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Tickets</span>
                </div>
              </button>
            </div>

            {/* Quick Student FAQs Banner */}
            <div 
              onClick={() => setMobileTab('faqs')}
              className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 rounded-2xl cursor-pointer hover:opacity-95 transition-opacity flex items-center justify-between shadow-2xs border border-blue-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Common Student Loan Questions</h4>
                  <p className="text-[10px] text-blue-200">Eligibility criteria, 25% rates & application deadlines</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300" />
            </div>

            {/* Lesotho Payment Channels Banner */}
            <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                Official Merchant Accounts
              </span>
              <div className={`flex items-center justify-between text-xs py-1 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Vodacom M-Pesa Merchant</span>
                <span className={`font-black px-2 py-0.5 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-red-950/80 text-red-300 border-red-800' 
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>882910</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1">
                <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Econet EcoCash Spaza</span>
                <span className={`font-black px-2 py-0.5 rounded-lg border ${
                  isDarkMode 
                    ? 'bg-blue-950/80 text-blue-300 border-blue-800' 
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}>99401</span>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB: CALCULATOR ================= */}
        {mobileTab === 'calc' && (
          <MobileLoanCalculator
            settings={settings}
            isDarkMode={isDarkMode}
            onApplyWithConfig={(amount, model) => {
              setApplyAmount(amount);
              setApplyRepaymentModel(model);
              setMobileTab('apply');
            }}
          />
        )}

        {/* ================= TAB: FAQS ================= */}
        {mobileTab === 'faqs' && (
          <MobileFAQs
            settings={settings}
            isDarkMode={isDarkMode}
            onNavigateTab={(tab) => setMobileTab(tab)}
            onOpenSupportTicket={() => setMobileTab('account')}
          />
        )}

        {/* ================= TAB 2: APPLY ================= */}
        {mobileTab === 'apply' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-3xl border shadow-2xs space-y-3 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Loan Application</h2>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configure your requested loan amount and review terms.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileTab('calc')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800 hover:bg-blue-900' 
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Calculator</span>
                </button>
              </div>

              {/* Amount Slider */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Borrowing Amount:</span>
                  <span className={`text-xl font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>{formatMaloti(applyAmount)}</span>
                </div>
                <input
                  type="range"
                  min={settings.minLoanAmount}
                  max={settings.maxLoanAmount}
                  step={50}
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className={`flex justify-between text-[10px] font-semibold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <span>Min: {formatMaloti(settings.minLoanAmount)}</span>
                  <span>Max: {formatMaloti(settings.maxLoanAmount)}</span>
                </div>
              </div>

              {/* Repayment Breakdown Table */}
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Principal:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{formatMaloti(applyAmount)}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Fixed Monthly Interest (25%):</span>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{formatMaloti(currentCalc.interestAmount)}</span>
                </div>
                <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <span>Term Period:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`}>{settings.repaymentPeriodDays} Days</span>
                </div>
                <div className={`border-t pt-2 flex justify-between font-black text-sm ${
                  isDarkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-900'
                }`}>
                  <span>Total Repayable:</span>
                  <span className={isDarkMode ? 'text-blue-400' : 'text-blue-900'}>{formatMaloti(currentCalc.totalRepayment)}</span>
                </div>
              </div>

              {/* Loan Purpose Select */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loan Purpose:</label>
                <select
                  value={applyPurpose}
                  onChange={(e) => setApplyPurpose(e.target.value)}
                  className={`w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                    isDarkMode 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="Textbooks and academic course materials">Textbooks & Academic Course Materials</option>
                  <option value="Hostel and accommodation rent">Hostel & Accommodation Rent</option>
                  <option value="Campus transport and daily commute">Campus Transport & Daily Commute</option>
                  <option value="Exam registration and lab fees">Exam Registration & Lab Fees</option>
                  <option value="Emergency food stipend">Emergency Food Stipend</option>
                </select>
              </div>

              {/* Repayment Schedule Model */}
              <div className="space-y-1">
                <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Repayment Plan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApplyRepaymentModel('one_month')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      applyRepaymentModel === 'one_month'
                        ? isDarkMode 
                          ? 'border-blue-500 bg-blue-950/80 text-blue-300' 
                          : 'border-blue-900 bg-blue-50 text-blue-900'
                        : isDarkMode 
                          ? 'border-slate-800 text-slate-400 hover:bg-slate-800' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    1 Month Bullet (Day 30)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyRepaymentModel('bi_weekly')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      applyRepaymentModel === 'bi_weekly'
                        ? isDarkMode 
                          ? 'border-blue-500 bg-blue-950/80 text-blue-300' 
                          : 'border-blue-900 bg-blue-50 text-blue-900'
                        : isDarkMode 
                          ? 'border-slate-800 text-slate-400 hover:bg-slate-800' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Bi-Weekly (2 Splits)
                  </button>
                </div>
              </div>

              {/* Eligibility Check Alert */}
              <div className={`p-3 rounded-2xl text-xs flex items-start gap-2 ${
                eligibilityCheck.isEligible 
                  ? isDarkMode 
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : isDarkMode 
                    ? 'bg-red-950/80 text-red-300 border border-red-800' 
                    : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {eligibilityCheck.isEligible ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold">
                    {eligibilityCheck.isEligible ? 'Eligible for instant approval' : 'Eligibility Notice'}
                  </strong>
                  <span>{eligibilityCheck.reason || 'All institutional criteria verified.'}</span>
                </div>
              </div>

              {/* Submit Application Button */}
              <button
                onClick={handleApplySubmit}
                disabled={!eligibilityCheck.isEligible}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-black shadow-xs transition-colors"
              >
                Submit Application ({formatMaloti(applyAmount)})
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 3: REPAY ================= */}
        {mobileTab === 'repay' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-3xl border shadow-2xs space-y-3 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Make Mobile Repayment</h2>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Settle your outstanding balance via Vodacom M-Pesa or Econet EcoCash.</p>

              {activeLoan ? (
                <form onSubmit={handleRepaymentSubmit} className="space-y-3">
                  <div className={`p-3 rounded-2xl border flex justify-between items-center text-xs ${
                    isDarkMode ? 'bg-blue-950/60 border-blue-900 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-800'
                  }`}>
                    <span className="font-semibold">Active Loan Balance:</span>
                    <span className={`font-black text-base ${isDarkMode ? 'text-white' : 'text-blue-950'}`}>{formatMaloti(activeLoan.balance)}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Select Mobile Channel:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPayMethod('mpesa')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          payMethod === 'mpesa'
                            ? isDarkMode ? 'border-red-500 bg-red-950/80 text-red-300' : 'border-red-600 bg-red-50 text-red-700'
                            : isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        M-Pesa
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod('ecocash')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          payMethod === 'ecocash'
                            ? isDarkMode ? 'border-blue-500 bg-blue-950/80 text-blue-300' : 'border-blue-600 bg-blue-50 text-blue-700'
                            : isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        EcoCash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayMethod('bank_transfer')}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                          payMethod === 'bank_transfer'
                            ? isDarkMode ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300' : 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Bank EFT
                      </button>
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Repayment Amount (Maloti):</label>
                    <input
                      type="number"
                      min={10}
                      max={activeLoan.balance}
                      value={payAmount || ''}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      placeholder={`Full: ${activeLoan.balance}`}
                      className={`w-full p-2.5 border rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Reference Input */}
                  <div className="space-y-1">
                    <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>M-Pesa / EcoCash SMS Reference:</label>
                    <input
                      type="text"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder="e.g. MP-849201"
                      className={`w-full p-2.5 border rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase ${
                        isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-xs transition-colors"
                  >
                    Confirm & Record Payment
                  </button>
                </form>
              ) : (
                <div className={`p-4 rounded-2xl text-center space-y-2 ${isDarkMode ? 'bg-slate-950/60' : 'bg-slate-50'}`}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>You have no outstanding loans to settle.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: ACTIVITY & HISTORY ================= */}
        {mobileTab === 'activity' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Visual Loan Status Tracker */}
            <LoanStatusTracker
              loan={activeLoan}
              allStudentLoans={studentLoans}
              repayments={myRepayments}
              onPayNow={(loanToPay, amt) => {
                setPayAmount(amt);
                setMobileTab('repay');
              }}
              onViewStatement={() => {}}
              onApplyNew={() => setMobileTab('apply')}
              onOpenCalculator={() => setMobileTab('calc')}
            />

            <div className={`p-4 rounded-3xl border shadow-2xs space-y-3 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h2 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Loan & Payment History</h2>
              
              {studentLoans.length > 0 ? (
                <div className="space-y-2.5">
                  {studentLoans.map((loan) => (
                    <div key={loan.id} className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      isDarkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}>
                      <div className="flex justify-between items-center">
                        <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Loan #{loan.loanNumber}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          loan.status === 'fully_paid' 
                            ? isDarkMode ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800'
                            : isDarkMode ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {loan.status.toUpperCase()}
                        </span>
                      </div>
                      <div className={`flex justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <span>Principal: {formatMaloti(loan.principal)}</span>
                        <span>Repaid: {formatMaloti(loan.amountPaid)} / {formatMaloti(loan.totalRepayable)}</span>
                      </div>
                      <div className={`flex justify-between text-[11px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span>Due: {loan.dueDate}</span>
                        <span>Balance: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{formatMaloti(loan.balance)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs text-center py-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No loan records available yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: AI ASSISTANT (FAQ-GROUNDED CHATBOT) ================= */}
        {mobileTab === 'ai' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <MobileAiChatbot
              currentUser={currentUser}
              activeLoan={activeLoan}
              settings={settings}
              isDarkMode={isDarkMode}
              onNavigateTab={(tab) => setMobileTab(tab as any)}
              onOpenSupportTicket={() => {
                setMobileTab('faqs');
              }}
            />
          </div>
        )}

        {/* ================= TAB 6: ACCOUNT & SETTINGS ================= */}
        {mobileTab === 'account' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className={`p-4 rounded-3xl border shadow-2xs space-y-4 transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              {/* Profile Header & Interactive Photo Avatar */}
              <div className="flex items-center gap-3.5">
                <div 
                  className="relative cursor-pointer group" 
                  onClick={() => currentUser && setShowCameraModal(true)}
                  title="Click to take or update profile photo"
                >
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500 shadow-md transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                      {currentUser?.fullName.charAt(0) || 'U'}
                    </div>
                  )}

                  {currentUser && (
                    <button
                      type="button"
                      id="account-avatar-camera-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCameraModal(true);
                      }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm transition-transform active:scale-90"
                      title="Take Photo using Camera"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className={`text-sm font-black truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {currentUser?.fullName || 'Guest User'}
                    </h3>
                    {currentUser?.isVerified && (
                      <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" title="Verified Student">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {currentUser?.email || 'Not logged in'}
                  </p>

                  {currentUser && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        type="button"
                        id="btn-take-profile-photo"
                        onClick={() => setShowCameraModal(true)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 shadow-2xs ${
                          isDarkMode 
                            ? 'bg-blue-950/80 hover:bg-blue-900 text-blue-300 border-blue-800' 
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                        }`}
                      >
                        <Camera className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{currentUser.avatarUrl ? 'Change Photo' : 'Take Photo (Camera)'}</span>
                      </button>

                      {currentUser.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => updateUserProfile(currentUser.id, { avatarUrl: undefined })}
                          className={`p-1 rounded-xl text-[10px] border transition-colors ${
                            isDarkMode 
                              ? 'text-slate-400 hover:text-rose-400 border-slate-800 hover:bg-slate-800' 
                              : 'text-slate-500 hover:text-rose-600 border-slate-200 hover:bg-rose-50'
                          }`}
                          title="Reset to default initials"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Student Verified Credentials Card */}
              {currentUser && (
                <div className={`space-y-2 border-t pt-3 text-xs ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                }`}>
                  <div className={`flex justify-between py-1 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-50'}`}>
                    <span>Student ID:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{currentUser.studentIdNumber || 'N/A'}</strong>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-50'}`}>
                    <span>Institution:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{currentUser.institution || 'N/A'}</strong>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-50'}`}>
                    <span>Faculty:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{currentUser.faculty || 'General Studies'}</strong>
                  </div>
                  <div className={`flex justify-between py-1 border-b ${isDarkMode ? 'border-slate-800/60' : 'border-slate-50'}`}>
                    <span>Year of Study:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>Year {currentUser.yearOfStudy || 1}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Emergency Contact:</span>
                    <strong className={isDarkMode ? 'text-slate-200' : 'text-slate-900'}>{currentUser.emergencyContactPhone || 'N/A'}</strong>
                  </div>
                </div>
              )}

              {/* Global Dark Mode Theme Setting Card */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    isDarkMode ? 'bg-amber-950/80 text-amber-300' : 'bg-blue-100 text-blue-900'
                  }`}>
                    {isDarkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-900" />}
                  </div>
                  <div>
                    <span className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Night Mode / Dark Theme</span>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {isDarkMode ? 'Dark UI enabled for night reading' : 'Light UI active for daylight'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                    isDarkMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {/* Push Notification Preferences in Account */}
              <div className={`p-3 rounded-2xl border space-y-2.5 transition-colors ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDarkMode ? 'bg-amber-950/80 text-amber-300' : 'bg-amber-100 text-amber-900'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className={`text-xs font-black block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Push Notifications</span>
                      <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {pushPreferences.pushEnabled ? 'FCM Alerts Active' : 'Push Muted'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => updatePushPreferences({ pushEnabled: !pushPreferences.pushEnabled })}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                      pushPreferences.pushEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {pushPreferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-500" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-xs">Notification Sound Chime</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePushPreferences({ soundEnabled: !pushPreferences.soundEnabled })}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      pushPreferences.soundEnabled 
                        ? 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                  >
                    {pushPreferences.soundEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Help & FAQs Section */}
              <div className={`space-y-1.5 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Help & Information</span>
                <button
                  type="button"
                  onClick={() => setMobileTab('faqs')}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-between ${
                    isDarkMode 
                      ? 'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700' 
                      : 'bg-blue-50/80 hover:bg-blue-100 text-blue-900 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    <span>Frequently Asked Questions (FAQs)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Demo Account Switcher */}
              <div className="space-y-1.5 pt-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Switch Demo Profile</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {allUsers.filter(u => u.role === 'student').map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setCurrentUser(student)}
                      className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                        currentUser?.id === student.id
                          ? isDarkMode 
                            ? 'border-blue-500 bg-blue-950/80 text-blue-300' 
                            : 'border-blue-900 bg-blue-50 text-blue-900'
                          : isDarkMode 
                            ? 'border-slate-800 hover:bg-slate-800 text-slate-300' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="block truncate font-bold">{student.fullName}</span>
                      <span className={`text-[10px] truncate block ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{student.institution}</span>
                    </button>
                  ))}
                </div>
              </div>

              {currentUser ? (
                <button
                  onClick={() => setCurrentUser(null)}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                    isDarkMode 
                      ? 'bg-red-950/60 hover:bg-red-950 text-red-300 border-red-900/60' 
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenAuth('login')}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Mobile Bottom Navigation Bar (iOS / Android Native Tab Bar) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-40 px-1 py-1.5 flex items-center justify-around backdrop-blur-md border-t transition-colors ${
        isDarkMode 
          ? 'bg-slate-900/95 border-slate-800 text-slate-400' 
          : 'bg-white/95 border-slate-200/80 text-slate-600'
      } ${deviceMode === 'ios' ? 'pb-5' : 'pb-2'}`}>
        <button
          onClick={() => setMobileTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'home' 
              ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-900 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[9px]">Home</span>
        </button>

        <button
          onClick={() => setMobileTab('calc')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'calc' 
              ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-900 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Calculator className="w-4.5 h-4.5" />
          <span className="text-[9px]">Calc</span>
        </button>

        <button
          onClick={() => setMobileTab('apply')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'apply' 
              ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-900 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <PlusCircle className="w-4.5 h-4.5" />
          <span className="text-[9px]">Apply</span>
        </button>

        <button
          onClick={() => setMobileTab('faqs')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'faqs' 
              ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-900 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <HelpCircle className="w-4.5 h-4.5" />
          <span className="text-[9px]">FAQs</span>
        </button>

        <button
          onClick={() => setMobileTab('repay')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'repay' 
              ? isDarkMode ? 'text-emerald-400 font-bold' : 'text-emerald-700 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <CreditCard className="w-4.5 h-4.5" />
          <span className="text-[9px]">Repay</span>
        </button>

        <button
          onClick={() => setMobileTab('ai')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'ai' 
              ? isDarkMode ? 'text-purple-400 font-bold' : 'text-purple-700 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          <span className="text-[9px]">AI</span>
        </button>

        <button
          onClick={() => setMobileTab('account')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
            mobileTab === 'account' 
              ? isDarkMode ? 'text-blue-400 font-bold' : 'text-blue-900 font-bold' 
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          <span className="text-[9px]">Profile</span>
        </button>
      </nav>

      {/* Digital Loan Agreement Modal */}
      {agreementModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className={`rounded-3xl max-w-sm w-full p-5 space-y-4 max-h-[80vh] overflow-y-auto border shadow-xl ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className={`text-base font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sign Digital Agreement</h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Loan of <strong>{formatMaloti(agreementModalApp.requestedAmount)}</strong> approved. Repayment is due in 30 days at 25% monthly interest.
            </p>

            <div className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Principal:</span>
                <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{formatMaloti(agreementModalApp.requestedAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Total Repayment:</span>
                <strong className={isDarkMode ? 'text-blue-400' : 'text-blue-900'}>
                  {formatMaloti(calculateLoan(agreementModalApp.requestedAmount, settings.monthlyInterestRate).totalRepayment)}
                </strong>
              </div>
            </div>

            <div className="space-y-1">
              <label className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Type Full Legal Name as Signature:</label>
              <input
                type="text"
                value={agreementSignedName}
                onChange={(e) => setAgreementSignedName(e.target.value)}
                placeholder="Full Legal Name"
                className={`w-full p-2.5 border rounded-xl text-xs font-bold ${
                  isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <label className={`flex items-start gap-2 text-xs cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <input
                type="checkbox"
                checked={agreementAcknowledged}
                onChange={(e) => setAgreementAcknowledged(e.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              <span>I acknowledge my legal obligation to repay this micro-loan within 30 days.</span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => setAgreementModalApp(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${
                  isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAgreementAccept}
                disabled={!agreementAcknowledged || !agreementSignedName.trim()}
                className="flex-1 py-2.5 bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Accept & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Center Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className={`rounded-3xl max-w-sm w-full p-4 space-y-3 max-h-[85vh] overflow-y-auto border shadow-xl flex flex-col ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Notification Center</h3>
                  <span className="text-[10px] text-slate-400">Firebase Cloud Messaging</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadNotifCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    title="Mark all as read"
                    className={`p-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                      isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read All</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Push Permission CTA Banner if not active */}
            {!pushPreferences.pushEnabled && (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-500">
                  <Radio className="w-4 h-4" />
                  <span className="text-xs font-bold">Enable FCM Device Push</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Get instant phone alerts when your loan is approved or repayments are due.
                </p>
                <button
                  type="button"
                  onClick={requestPushPermission}
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Enable Push Notifications
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['all', 'loan_status', 'repayment_reminder', 'announcement'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setNotifFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-colors ${
                    notifFilter === filterKey
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterKey === 'all' && 'All Alerts'}
                  {filterKey === 'loan_status' && 'Loan Status'}
                  {filterKey === 'repayment_reminder' && 'Repayments'}
                  {filterKey === 'announcement' && 'Announcements'}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px]">
              {displayNotifications.length > 0 ? (
                displayNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markNotificationAsRead(notif.id)}
                    className={`p-3 rounded-2xl border text-xs space-y-1 cursor-pointer transition-all ${
                      !notif.isRead 
                        ? isDarkMode ? 'bg-blue-950/40 border-blue-800/80 shadow-xs' : 'bg-blue-50/70 border-blue-200 shadow-xs'
                        : isDarkMode ? 'bg-slate-950/60 border-slate-800/60' : 'bg-slate-50 border-slate-200/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        )}
                        <span className="font-bold truncate max-w-[190px]">{notif.title}</span>
                      </div>
                      <span className="text-[9px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {notif.message}
                    </p>

                    {notif.category && (
                      <div className="pt-1 flex items-center justify-between">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                          notif.category === 'loan_status' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : notif.category === 'repayment_reminder' || notif.category === 'overdue_alert'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {notif.category.replace('_', ' ')}
                        </span>

                        {notif.category === 'repayment_reminder' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNotificationsModal(false);
                              setMobileTab('repay');
                            }}
                            className="text-[10px] font-bold text-emerald-500 hover:underline"
                          >
                            Repay Now →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 space-y-1">
                  <Bell className="w-8 h-8 mx-auto text-slate-400 opacity-40" />
                  <p className="text-xs text-slate-400">No notifications in this filter.</p>
                </div>
              )}
            </div>

            {/* Test Simulation Controls */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Simulate Real-Time Push Triggers
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => simulateTestPushNotification('loan_approval')}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-colors flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200'
                  }`}
                >
                  <span>Loan Approved</span>
                  <Play className="w-2.5 h-2.5 text-emerald-500" />
                </button>

                <button
                  type="button"
                  onClick={() => simulateTestPushNotification('repayment_due')}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-colors flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                  }`}
                >
                  <span>Due in 3 Days</span>
                  <Play className="w-2.5 h-2.5 text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => simulateTestPushNotification('overdue')}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-colors flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border-slate-700' : 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200'
                  }`}
                >
                  <span>Overdue Notice</span>
                  <Play className="w-2.5 h-2.5 text-rose-500" />
                </button>

                <button
                  type="button"
                  onClick={() => simulateTestPushNotification('announcement')}
                  className={`p-2 rounded-xl text-[10px] font-bold border text-left transition-colors flex items-center justify-between ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-blue-300 border-slate-700' : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
                  }`}
                >
                  <span>Admin Broadcast</span>
                  <Play className="w-2.5 h-2.5 text-blue-500" />
                </button>
              </div>
            </div>

            {/* Clear All action */}
            {displayNotifications.length > 0 && (
              <button
                type="button"
                onClick={clearAllNotifications}
                className="w-full py-1.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear All Notifications</span>
              </button>
            )}
          </div>
        </div>
      )}

    {/* Device Camera Profile Photo Capture Modal */}
    <CameraCaptureModal
      isOpen={showCameraModal}
      onClose={() => setShowCameraModal(false)}
      onSavePhoto={(photoDataUrl) => {
        if (currentUser) {
          updateUserProfile(currentUser.id, { avatarUrl: photoDataUrl });
        }
      }}
      onRemovePhoto={currentUser?.avatarUrl ? () => {
        if (currentUser) {
          updateUserProfile(currentUser.id, { avatarUrl: undefined });
        }
      } : undefined}
      currentPhotoUrl={currentUser?.avatarUrl}
      studentName={currentUser?.fullName}
      isDarkMode={isDarkMode}
    />

    </div>
  );
};
