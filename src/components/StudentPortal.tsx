import React, { useState } from 'react';
import { 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  ArrowRight, 
  Sparkles, 
  CreditCard, 
  Download, 
  HelpCircle, 
  PlusCircle, 
  Check, 
  X, 
  MessageSquare, 
  ShieldCheck, 
  Smartphone, 
  User, 
  ChevronRight, 
  Printer, 
  ExternalLink,
  WifiOff,
  Database,
  Camera,
  Trash2,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Radio,
  Megaphone,
  CheckCheck,
  Settings2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Loan, LoanApplication, Repayment } from '../types';
import { formatMaloti, calculateLoan, evaluateEligibility, formatPercent } from '../utils/loanEngine';
import { CameraCaptureModal } from './CameraCaptureModal';

export const StudentPortal: React.FC = () => {
  const { 
    currentUser, 
    updateUserProfile,
    loans, 
    applications, 
    repayments, 
    settings, 
    notifications,
    announcements,
    pushPreferences,
    requestPushPermission,
    updatePushPreferences,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications,
    simulateTestPushNotification,
    submitLoanApplication, 
    acceptLoanAgreement, 
    recordRepayment, 
    createSupportTicket, 
    replyToSupportTicket, 
    supportTickets,
    isOnline,
    isOfflinePersistenceEnabled
  } = useApp();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'repay' | 'history' | 'ai' | 'support' | 'profile' | 'notifications'>('overview');
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'loan_status' | 'repayment_deadline' | 'announcement'>('all');

  // Modals state
  const [agreementModalApp, setAgreementModalApp] = useState<LoanApplication | null>(null);
  const [agreementSignedName, setAgreementSignedName] = useState<string>(currentUser?.fullName || '');
  const [agreementAcknowledged, setAgreementAcknowledged] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);

  const [statementLoan, setStatementLoan] = useState<Loan | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Repayment | null>(null);

  // Application wizard state
  const [applyAmount, setApplyAmount] = useState<number>(600);
  const [applyPurpose, setApplyPurpose] = useState<string>('Textbooks and academic course materials');
  const [applyRepaymentModel, setApplyRepaymentModel] = useState<'one_month' | 'bi_weekly'>('one_month');
  const [applyStep, setApplyStep] = useState<number>(1);

  // Repayment form state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'mpesa' | 'ecocash' | 'bank_transfer'>('mpesa');
  const [payRef, setPayRef] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello ${currentUser?.fullName || 'there'}! I am POKOLA AI, your dedicated student loan assistant. You can ask me about your balance, interest calculations, due dates, or payment methods anytime!`,
      time: 'Just now',
    },
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // Support ticket form
  const [newTicketSubject, setNewTicketSubject] = useState<string>('');
  const [newTicketCategory, setNewTicketCategory] = useState<'payment_query' | 'technical_issue' | 'extension_request' | 'other'>('payment_query');
  const [newTicketMessage, setNewTicketMessage] = useState<string>('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState<string>('');

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please sign in or switch to a student account.
      </div>
    );
  }

  // Filter student-specific records
  const myLoans = loans.filter((l) => l.studentId === currentUser.id);
  const activeLoan = myLoans.find((l) => l.status === 'active' || l.status === 'partially_paid' || l.status === 'overdue');
  const myApplications = applications.filter((a) => a.studentId === currentUser.id);
  const pendingApplication = myApplications.find((a) => a.status === 'submitted' || a.status === 'under_review' || a.status === 'approved');
  const myRepayments = repayments.filter((r) => r.studentId === currentUser.id);
  const myTickets = supportTickets.filter((t) => t.studentId === currentUser.id);

  // Application calculation live
  const applyCalc = calculateLoan(
    applyAmount,
    settings.monthlyInterestRate,
    settings.defaultRepaymentPeriodDays,
    applyRepaymentModel
  );

  const eligibilityCheck = evaluateEligibility(currentUser, loans, applyAmount, settings);

  // Calculate days remaining or overdue
  const getDaysRemainingInfo = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { days: diffDays, text: `${diffDays} days remaining`, status: 'normal' };
    } else if (diffDays === 0) {
      return { days: 0, text: 'Due Today!', status: 'due_today' };
    } else {
      return { days: Math.abs(diffDays), text: `${Math.abs(diffDays)} days overdue`, status: 'overdue' };
    }
  };

  // Submit Application Handler
  const handleApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitLoanApplication(applyAmount, applyPurpose, applyRepaymentModel);
    if (res.success) {
      setActiveTab('overview');
      setApplyStep(1);
    }
  };

  // Accept Agreement Handler
  const handleAcceptAgreement = () => {
    if (!agreementModalApp) return;
    if (!agreementAcknowledged) {
      alert('Please acknowledge that you have read and agreed to the loan terms.');
      return;
    }
    const res = acceptLoanAgreement(agreementModalApp.id, {
      acknowledgedTerms: true,
      legalName: agreementSignedName,
    });
    if (res.success) {
      setAgreementModalApp(null);
      setActiveTab('overview');
    }
  };

  // Record Repayment Handler
  const handleRecordRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLoan) return;
    const res = recordRepayment({
      loanId: activeLoan.id,
      amount: payAmount || activeLoan.balance,
      paymentMethod: payMethod,
      transactionReference: payRef,
      notes: payNotes,
    });
    if (res.success) {
      setPayAmount(0);
      setPayRef('');
      setPayNotes('');
      if (res.receipt) {
        setSelectedReceipt(res.receipt);
      }
      setActiveTab('overview');
    }
  };

  // Send AI Message
  const handleSendAiMessage = async (textToSend?: string) => {
    const query = textToSend || aiInput;
    if (!query.trim()) return;

    const userMsg = { sender: 'user' as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          studentContext: {
            studentName: currentUser.fullName,
            studentIdNumber: currentUser.studentIdNumber,
            institution: currentUser.institution,
            activeLoan: activeLoan ? {
              loanNumber: activeLoan.loanNumber,
              principal: activeLoan.principal,
              interestAmount: activeLoan.interestAmount,
              totalRepayable: activeLoan.totalRepayable,
              amountPaid: activeLoan.amountPaid,
              balance: activeLoan.balance,
              dueDate: activeLoan.dueDate,
              status: activeLoan.status,
            } : null,
            completedLoansCount: myLoans.filter((l) => l.status === 'fully_paid').length,
            eligibilityStatus: eligibilityCheck.isEligible ? 'Eligible' : 'Not Eligible',
          },
        }),
      });

      const data = await resp.json();
      const aiReply = data.reply || 'I could not generate a response. Please try again.';
      setAiMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      console.error(err);
      setAiMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered a connection issue. Please check your network and try again.', time: 'Just now' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick AI chips
  const aiQuickPrompts = [
    'How much do I still owe?',
    'When is my next loan payment due?',
    'How was my 25% interest calculated?',
    'How do I pay with Vodacom M-Pesa?',
    'Can I pay off my loan early?',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Student Welcome & Top Navigation Subheader */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-900 to-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-900/20">
            {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{currentUser.fullName}</h1>
              {currentUser.isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" /> Verified Student
                </span>
              )}
              {!isOnline && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <WifiOff className="w-3 h-3 text-amber-600" /> Offline Mode (Cached)
                </span>
              )}
              {isOnline && isOfflinePersistenceEnabled && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200" title="Firestore local multi-tab IndexedDB cache active">
                  <Database className="w-3 h-3 text-emerald-600" /> Offline Cache Ready
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.institution} • Student ID: <strong className="text-slate-700">{currentUser.studentIdNumber}</strong> • Year {currentUser.yearOfStudy}
            </p>
          </div>
        </div>

        {/* Sub-tab navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'apply'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Apply for Loan
          </button>

          {activeLoan && (
            <button
              onClick={() => {
                setActiveTab('repay');
                setPayAmount(activeLoan.balance);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'repay'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Make Repayment
            </button>
          )}

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Loan History
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> POKOLA AI
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'support'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Support Desk
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BellRing className="w-3.5 h-3.5 text-amber-500" /> Notifications
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'profile'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. OVERVIEW TAB */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Action Callout if an application is Approved & pending signature */}
          {pendingApplication && pendingApplication.status === 'approved' && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved Application
                </div>
                <h3 className="text-lg font-bold">
                  Your loan application {pendingApplication.applicationNumber} for {formatMaloti(pendingApplication.requestedAmount)} is APPROVED!
                </h3>
                <p className="text-xs text-emerald-100/80">
                  Please review and digitally sign your loan agreement to immediately activate your disbursement.
                </p>
              </div>
              <button
                onClick={() => setAgreementModalApp(pendingApplication)}
                className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-950 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-md transition-all shrink-0 uppercase tracking-wider"
              >
                Sign Loan Agreement
              </button>
            </div>
          )}

          {/* If an application is submitted / under review */}
          {pendingApplication && (pendingApplication.status === 'submitted' || pendingApplication.status === 'under_review') && (
            <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-700 shrink-0 animate-spin" />
                <div>
                  <h4 className="text-sm font-bold text-blue-950">
                    Application {pendingApplication.applicationNumber} is Under Review
                  </h4>
                  <p className="text-xs text-blue-700">
                    Requested: {formatMaloti(pendingApplication.requestedAmount)} • Applied: {new Date(pendingApplication.appliedAt).toLocaleDateString()} • Assigned to loan officer
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-blue-200 text-blue-900 rounded-full">
                Under Officer Review
              </span>
            </div>
          )}

          {/* Primary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Limit Card */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Maximum Limit</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatMaloti(settings.maxLoanAmount, false)}
              </p>
              <p className="text-[11px] text-slate-500">
                Available per active lending cycle
              </p>
            </div>

            {/* Current Active Loan Status */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Balance</span>
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {activeLoan ? formatMaloti(activeLoan.balance) : 'M0.00'}
              </p>
              <p className="text-[11px] text-slate-500">
                {activeLoan ? `Total repayable: ${formatMaloti(activeLoan.totalRepayable)}` : 'No active loan debt'}
              </p>
            </div>

            {/* Due Date & Remaining */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Repayment Deadline</span>
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {activeLoan ? activeLoan.dueDate : '—'}
              </p>
              <p className="text-[11px] font-semibold text-blue-700">
                {activeLoan ? getDaysRemainingInfo(activeLoan.dueDate).text : 'No active repayment due'}
              </p>
            </div>

            {/* Interest Rate & Model */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Monthly Interest</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {(settings.monthlyInterestRate * 100).toFixed(0)}%
              </p>
              <p className="text-[11px] text-slate-500">
                Simple monthly interest formula
              </p>
            </div>

          </div>

          {/* Active Loan Details Panel (If Active) */}
          {activeLoan ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Active Loan Facility
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      activeLoan.status === 'active' 
                        ? 'bg-blue-100 text-blue-800'
                        : activeLoan.status === 'partially_paid'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {activeLoan.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Loan #{activeLoan.loanNumber}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('repay');
                      setPayAmount(activeLoan.balance);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 uppercase tracking-wider"
                  >
                    <CreditCard className="w-4 h-4" /> Make Payment
                  </button>

                  <button
                    onClick={() => setStatementLoan(activeLoan)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    title="View official statement"
                  >
                    <FileText className="w-4 h-4" /> Statement
                  </button>
                </div>
              </div>

              {/* Progress & Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Repayment Progress</span>
                  <span>
                    {formatMaloti(activeLoan.amountPaid)} paid of {formatMaloti(activeLoan.totalRepayable)} ({((activeLoan.amountPaid / activeLoan.totalRepayable) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, (activeLoan.amountPaid / activeLoan.totalRepayable) * 100)}%` }}
                  />
                </div>
              </div>

              {/* 4 Financial Components Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Principal Disbursed</p>
                  <p className="text-lg font-black text-slate-900">{formatMaloti(activeLoan.principal)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Contract Interest (25%)</p>
                  <p className="text-lg font-black text-emerald-700">+{formatMaloti(activeLoan.interestAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Amount Repayable</p>
                  <p className="text-lg font-black text-slate-900">{formatMaloti(activeLoan.totalRepayable)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Outstanding Balance</p>
                  <p className="text-lg font-black text-rose-700">{formatMaloti(activeLoan.balance)}</p>
                </div>
              </div>

              {/* Repayment Installment Schedule */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Repayment Installments & Due Dates
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Due Date</th>
                        <th className="p-3">Expected Amount</th>
                        <th className="p-3">Amount Paid</th>
                        <th className="p-3">Remaining</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeLoan.schedule.map((item) => (
                        <tr key={item.installmentNumber} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-900">Installment {item.installmentNumber}</td>
                          <td className="p-3 font-semibold text-slate-700">{item.dueDate}</td>
                          <td className="p-3 font-bold text-slate-900">{formatMaloti(item.expectedAmount)}</td>
                          <td className="p-3 font-semibold text-emerald-700">{formatMaloti(item.amountPaid)}</td>
                          <td className="p-3 font-bold text-rose-700">{formatMaloti(item.remainingAmount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : item.status === 'partially_paid'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            /* If no active loan, show Apply Banner */
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Student Credit Access
                </div>
                <h3 className="text-2xl font-black">
                  Ready to apply for student financial assistance?
                </h3>
                <p className="text-sm text-blue-100/80 max-w-xl">
                  Borrow up to {formatMaloti(settings.maxLoanAmount, false)} for textbooks, groceries, transport, or tuition top-ups with transparent 25% simple interest.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('apply')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/30 transition-all hover:scale-103 shrink-0 flex items-center gap-2 uppercase tracking-wider"
              >
                Apply for Loan <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Recent Repayments History */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" /> Recent Payment Receipts
              </h3>
              {myRepayments.length > 0 && (
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  View All Receipts <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {myRepayments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {myRepayments.slice(0, 3).map((rep) => (
                  <div key={rep.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {rep.receiptNumber} • {formatMaloti(rep.amount)}
                        </p>
                        <p className="text-[11px] text-slate-500 uppercase">
                          {rep.paymentMethod} • Ref: {rep.transactionReference} • {new Date(rep.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedReceipt(rep)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      View Receipt
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No repayments made yet.
              </p>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. APPLY FOR LOAN TAB */}
      {/* ========================================================= */}
      {activeTab === 'apply' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Application Wizard
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Apply for Student Loan Assistance
            </h2>
            <p className="text-xs text-slate-500">
              Transparent lending • 25% Monthly Simple Interest • 30-Day Term
            </p>
          </div>

          {/* Eligibility Alert Banner */}
          {!eligibilityCheck.isEligible ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 space-y-1">
                <p className="font-bold">Eligibility Notice</p>
                <p>{eligibilityCheck.reason}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-800">
                <p className="font-bold">You are Pre-Qualified!</p>
                <p>Your student profile meets institutional registration requirements for up to {formatMaloti(settings.maxLoanAmount, false)}.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleApplicationSubmit} className="space-y-6">
            
            {/* Amount Slider & Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select Loan Amount (Maloti)
                </label>
                <span className="text-2xl font-black text-blue-900">
                  {formatMaloti(applyAmount, false)}
                </span>
              </div>

              <input
                type="range"
                min={settings.minLoanAmount}
                max={settings.maxLoanAmount}
                step={50}
                value={applyAmount}
                onChange={(e) => setApplyAmount(Number(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
              />

              <div className="flex justify-between text-[11px] font-semibold text-slate-400">
                <span>Min: {formatMaloti(settings.minLoanAmount, false)}</span>
                <span>Max: {formatMaloti(settings.maxLoanAmount, false)}</span>
              </div>
            </div>

            {/* Purpose */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Loan Purpose / Educational Need
              </label>
              <select
                value={applyPurpose}
                onChange={(e) => setApplyPurpose(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-700 focus:outline-hidden"
              >
                <option value="Textbooks and academic course materials">Textbooks & Academic Course Materials</option>
                <option value="Living, groceries and meal allowances">Living, Groceries & Meal Allowance</option>
                <option value="Off-campus student accommodation top-up">Off-Campus Student Accommodation</option>
                <option value="Transport fare and daily commute">Transport Fare & Daily Commute</option>
                <option value="Exam registration and lab fees">Exam Registration & Lab Fees</option>
                <option value="Laptop or digital study equipment repair">Digital Study Equipment Repair</option>
              </select>
            </div>

            {/* Repayment Schedule Option */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Repayment Frequency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setApplyRepaymentModel('one_month')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    applyRepaymentModel === 'one_month'
                      ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-700/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold">Single Bullet Repayment</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Pay total on Day 30 ({applyCalc.dueDate})</p>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyRepaymentModel('bi_weekly')}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    applyRepaymentModel === 'bi_weekly'
                      ? 'border-blue-700 bg-blue-50 text-blue-900 ring-2 ring-blue-700/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-extrabold">2 Bi-Weekly Installments</p>
                  <p className="text-[10px] text-slate-500 font-normal mt-0.5">Pay 50% at Day 14 and 50% at Day 30</p>
                </button>
              </div>
            </div>

            {/* Clear Transparent Math Box */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Transparent Loan Calculation
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  Fixed Rate {(settings.monthlyInterestRate * 100).toFixed(0)}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Requested Principal:</span>
                  <span className="font-bold text-white">{applyCalc.formattedPrincipal}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Monthly Interest (25% × 30 Days):</span>
                  <span className="font-bold text-emerald-400">+{applyCalc.formattedInterest}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Repayment Due Date:</span>
                  <span className="font-bold text-white">{applyCalc.dueDate}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Disbursement Account:</span>
                  <span className="font-bold text-white uppercase">{currentUser.preferredRepaymentMethod} ({currentUser.phone})</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">Total Due Upon Settlement</p>
                  <p className="text-[10px] text-slate-500">Zero additional processing deductions</p>
                </div>
                <span className="text-2xl font-black text-emerald-300">
                  {applyCalc.formattedTotal}
                </span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!eligibilityCheck.isEligible}
                className="px-8 py-3.5 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-2"
              >
                Submit Application <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. REPAYMENT TAB */}
      {/* ========================================================= */}
      {activeTab === 'repay' && activeLoan && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Loan Settlement
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Record Repayment for Loan #{activeLoan.loanNumber}
            </h2>
            <p className="text-xs text-slate-500">
              Outstanding Balance: <strong className="text-rose-700 font-black">{formatMaloti(activeLoan.balance)}</strong> • Due Date: {activeLoan.dueDate}
            </p>
          </div>

          <form onSubmit={handleRecordRepayment} className="space-y-6">
            
            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Select Payment Channel in Lesotho
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPayMethod('mpesa')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'mpesa'
                      ? 'border-rose-600 bg-rose-50/50 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-extrabold text-xs">Vodacom M-Pesa</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Mobile Money</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('ecocash')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'ecocash'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-extrabold text-xs">Econet EcoCash</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Mobile Money</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod('bank_transfer')}
                  className={`p-3.5 rounded-2xl border text-center transition-all ${
                    payMethod === 'bank_transfer'
                      ? 'border-purple-600 bg-purple-50/50 text-purple-900 ring-2 ring-purple-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <p className="font-extrabold text-xs">Bank Transfer</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Standard Lesotho / FNB</p>
                </button>
              </div>
            </div>

            {/* Mobile Channel Instructions Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-900">
                Payment Instructions for {payMethod === 'mpesa' ? 'Vodacom M-Pesa' : payMethod === 'ecocash' ? 'Econet EcoCash' : 'Bank Transfer'}:
              </p>
              {payMethod === 'mpesa' && (
                <p className="text-slate-600 leading-relaxed">
                  Dial <strong>*111#</strong> &gt; Send Money / Pay Merchant &gt; POKOLA Till: <strong>58900-PKL</strong> &gt; Enter Amount &gt; Use your Student ID <strong>{currentUser.studentIdNumber}</strong> as reference. Copy the resulting confirmation code (e.g. MP-84910) below.
                </p>
              )}
              {payMethod === 'ecocash' && (
                <p className="text-slate-600 leading-relaxed">
                  Dial <strong>*151#</strong> &gt; EcoCash Pay &gt; Merchant Code: <strong>EC-7721</strong> &gt; Amount &gt; Reference: <strong>{currentUser.studentIdNumber}</strong>. Copy your SMS transaction code.
                </p>
              )}
              {payMethod === 'bank_transfer' && (
                <p className="text-slate-600 leading-relaxed">
                  Standard Lesotho Bank | Account: <strong>908000492819</strong> | Branch: Maseru City (060167) | Ref: <strong>{currentUser.studentIdNumber}</strong>.
                </p>
              )}
            </div>

            {/* Amount input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Repayment Amount (Maloti)
                </label>
                <button
                  type="button"
                  onClick={() => setPayAmount(activeLoan.balance)}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900"
                >
                  Pay Full Balance ({formatMaloti(activeLoan.balance)})
                </button>
              </div>
              <input
                type="number"
                min={10}
                max={activeLoan.balance}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                placeholder={`e.g. ${activeLoan.balance}`}
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Transaction Reference */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Mobile Money Reference Code / SMS ID
              </label>
              <input
                type="text"
                value={payRef}
                onChange={(e) => setPayRef(e.target.value.toUpperCase())}
                placeholder="e.g. MP-948123 or ECO-7491"
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Additional Notes (Optional)
              </label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="e.g. Full settlement via personal M-Pesa"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Preview Box */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div>
                <p className="font-bold">Remaining Balance After This Payment:</p>
                <p className="text-[11px] text-emerald-700">Updates immediately upon confirmation</p>
              </div>
              <span className="text-lg font-black text-emerald-950">
                {formatMaloti(Math.max(0, activeLoan.balance - (payAmount || 0)))}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                type="submit"
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center gap-2"
              >
                Confirm & Record Payment <Check className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. LOAN HISTORY TAB */}
      {/* ========================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              All Loan Facilities & Completed Records
            </h3>

            {myLoans.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Loan Number</th>
                      <th className="p-3.5">Disbursed Date</th>
                      <th className="p-3.5">Principal</th>
                      <th className="p-3.5">Interest (25%)</th>
                      <th className="p-3.5">Total Repayable</th>
                      <th className="p-3.5">Paid</th>
                      <th className="p-3.5">Balance</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myLoans.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5 font-bold text-slate-900">{l.loanNumber}</td>
                        <td className="p-3.5 text-slate-600">{new Date(l.disbursedAt).toLocaleDateString()}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{formatMaloti(l.principal)}</td>
                        <td className="p-3.5 font-semibold text-emerald-700">+{formatMaloti(l.interestAmount)}</td>
                        <td className="p-3.5 font-bold text-slate-900">{formatMaloti(l.totalRepayable)}</td>
                        <td className="p-3.5 font-semibold text-emerald-700">{formatMaloti(l.amountPaid)}</td>
                        <td className="p-3.5 font-bold text-rose-700">{formatMaloti(l.balance)}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            l.status === 'fully_paid' 
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : l.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {l.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setStatementLoan(l)}
                            className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                          >
                            Statement <FileText className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                No past loan facilities found.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. POKOLA AI ASSISTANT TAB */}
      {/* ========================================================= */}
      {activeTab === 'ai' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden max-w-3xl mx-auto flex flex-col h-[650px]">
          
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-amber-300 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">POKOLA AI Assistant</h3>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-semibold border border-purple-400/30">
                    Gemini 3.7 Flash
                  </span>
                </div>
                <p className="text-xs text-purple-200/70">
                  Student Loan Advisor for {currentUser.fullName}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAiMessages([
                  {
                    sender: 'ai',
                    text: `Chat reset. How can I assist you with your POKOLA loan in Lesotho today?`,
                    time: 'Just now',
                  },
                ]);
              }}
              className="text-xs text-purple-200 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15"
            >
              Clear Chat
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {aiQuickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendAiMessage(prompt)}
                disabled={aiLoading}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {aiMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-700 text-white rounded-tr-none shadow-md shadow-blue-700/10'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {currentUser.fullName[0]}
                  </div>
                )}
              </div>
            ))}

            {aiLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-900 text-amber-300 flex items-center justify-center text-xs shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 rounded-tl-none shadow-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                  <span>POKOLA AI is computing loan details...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Ask about your balance, interest, due date, or M-Pesa steps..."
                disabled={aiLoading}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-purple-600 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiInput.trim()}
                className="p-3 bg-purple-900 hover:bg-purple-800 disabled:bg-slate-200 text-white rounded-xl shadow-xs transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 6. SUPPORT DESK TAB */}
      {/* ========================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          
          {/* New Ticket Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> Create Support or Hardship Ticket
            </h3>
            <p className="text-xs text-slate-500">
              Need assistance with payment verification, due date extensions, or technical queries? A loan officer will respond within 24 hours.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTicketSubject || !newTicketMessage) return;
                createSupportTicket(newTicketSubject, newTicketCategory, newTicketMessage);
                setNewTicketSubject('');
                setNewTicketMessage('');
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={newTicketSubject}
                    onChange={(e) => setNewTicketSubject(e.target.value)}
                    placeholder="e.g. M-Pesa receipt verification"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Category</label>
                  <select
                    value={newTicketCategory}
                    onChange={(e) => setNewTicketCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  >
                    <option value="payment_query">Payment & Receipt Query</option>
                    <option value="extension_request">Grace Period / Hardship Extension</option>
                    <option value="technical_issue">Technical / Verification Issue</option>
                    <option value="other">General Inquiries</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">Message</label>
                <textarea
                  rows={3}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Explain your request or issue with full detail..."
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>

          {/* Past Tickets List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Your Support Tickets</h3>
            
            {myTickets.length > 0 ? (
              <div className="space-y-4">
                {myTickets.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{t.ticketNumber}: {t.subject}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>

                    <p className="text-xs text-slate-600">{t.message}</p>

                    {/* Replies */}
                    {t.replies.length > 0 && (
                      <div className="pl-4 border-l-2 border-blue-500 space-y-2 pt-2">
                        {t.replies.map((r) => (
                          <div key={r.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs">
                            <div className="flex justify-between font-bold text-slate-900 text-[11px] mb-1">
                              <span>{r.senderName} ({r.senderRole})</span>
                              <span className="text-slate-400 font-normal">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-slate-700">{r.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply box */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedTicketId === t.id ? ticketReplyText : ''}
                        onFocus={() => setSelectedTicketId(t.id)}
                        onChange={(e) => {
                          setSelectedTicketId(t.id);
                          setTicketReplyText(e.target.value);
                        }}
                        placeholder="Reply to officer..."
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                      />
                      <button
                        onClick={() => {
                          if (selectedTicketId === t.id && ticketReplyText.trim()) {
                            replyToSupportTicket(t.id, ticketReplyText);
                            setTicketReplyText('');
                          }
                        }}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                      >
                        Reply
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No support tickets raised yet.
              </p>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 7. PROFILE TAB */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div 
              className="relative cursor-pointer group"
              onClick={() => setShowCameraModal(true)}
              title="Click to take or change profile picture"
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-600 shadow-md transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white font-black text-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                  {currentUser.fullName[0]}
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCameraModal(true);
                }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white border-2 border-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
                title="Take Photo with Camera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 truncate">{currentUser.fullName}</h2>
              <p className="text-xs text-slate-500 truncate">{currentUser.email} • {currentUser.phone}</p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>{currentUser.avatarUrl ? 'Update Profile Photo' : 'Take Photo (Camera)'}</span>
                </button>
                {currentUser.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateUserProfile(currentUser.id, { avatarUrl: undefined })}
                    className="p-1 rounded-xl text-slate-400 hover:text-rose-600 border border-slate-200 hover:bg-rose-50 transition-colors"
                    title="Remove custom photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Institution</span>
              <span className="font-bold text-slate-800 text-sm">{currentUser.institution}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Student ID Number</span>
              <span className="font-bold text-slate-800 text-sm font-mono">{currentUser.studentIdNumber}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Faculty / Department</span>
              <span className="font-bold text-slate-800">{currentUser.faculty}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Academic Year</span>
              <span className="font-bold text-slate-800">Year {currentUser.yearOfStudy}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Residential Address</span>
              <span className="font-bold text-slate-800">{currentUser.residentialAddress}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-400 font-bold uppercase block text-[10px]">Preferred Payment Method</span>
              <span className="font-bold text-slate-800 uppercase">{currentUser.preferredRepaymentMethod}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Emergency Contact</h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{currentUser.emergencyContactName} ({currentUser.emergencyContactRelation})</p>
                <p className="text-slate-500">{currentUser.emergencyContactPhone}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Registered Contact
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 8. NOTIFICATIONS & PUSH PREFERENCES TAB */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-8">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-blue-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  FCM Push Alerts Service
                </span>
                {pushPreferences.fcmToken && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                    Token: {pushPreferences.fcmToken.slice(0, 14)}...
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Student Notification & Alert Preferences
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Stay updated in real-time regarding loan application reviews, automated disbursements, repayment due date reminders, and administrative announcements across all your devices.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  await requestPushPermission();
                }}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <BellRing className="w-4 h-4" />
                <span>{pushPreferences.enabled ? 'Refresh Push Token' : 'Enable Push Notifications'}</span>
              </button>
            </div>
          </div>

          {/* Test Push Triggers & Notification Preferences Grid */}
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Preferences Controls (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Push & Chime Channels</h3>
                  <p className="text-xs text-slate-500">Configure alert delivery options</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Push Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive FCM pushes on this device</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushPreferences.enabled}
                    onChange={(e) => updatePushPreferences({ enabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {pushPreferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                      Audio Chime Tone
                    </p>
                    <p className="text-[11px] text-slate-500">Play harmonic Lesotho audio cue</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushPreferences.soundEnabled}
                    onChange={(e) => updatePushPreferences({ soundEnabled: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Loan Status Updates</p>
                    <p className="text-[11px] text-slate-500">Application approvals & disbursements</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushPreferences.loanStatusUpdates}
                    onChange={(e) => updatePushPreferences({ loanStatusUpdates: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Repayment Due Reminders</p>
                    <p className="text-[11px] text-slate-500">3-day, 1-day, and due date alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushPreferences.repaymentReminders}
                    onChange={(e) => updatePushPreferences({ repaymentReminders: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">Campus Announcements</p>
                    <p className="text-[11px] text-slate-500">Official POKOLA & institution bulletins</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushPreferences.announcements}
                    onChange={(e) => updatePushPreferences({ announcements: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                </div>
              </div>

              {/* Push Simulation Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Test Push Triggers
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => simulateTestPushNotification('loan_approval')}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-bold text-slate-700 transition-colors text-center border border-slate-200"
                  >
                    Loan Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateTestPushNotification('repayment_due')}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 hover:text-amber-800 text-[11px] font-bold text-slate-700 transition-colors text-center border border-slate-200"
                  >
                    Payment Due
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateTestPushNotification('announcement')}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-[11px] font-bold text-slate-700 transition-colors text-center border border-slate-200"
                  >
                    Campus Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Notification History Feed (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Notifications Inbox ({notifications.length})
                  </h3>
                  <p className="text-xs text-slate-500">Live feed of all alerts delivered to your profile</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => markAllNotificationsAsRead()}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
                  </button>
                  <button
                    type="button"
                    onClick={() => clearAllNotifications()}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                {(['all', 'unread', 'loan_status', 'repayment_deadline', 'announcement'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setNotifFilter(filterKey)}
                    className={`px-3 py-1.5 rounded-xl transition-all shrink-0 ${
                      notifFilter === filterKey
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filterKey === 'all' && 'All Alerts'}
                    {filterKey === 'unread' && `Unread (${notifications.filter((n) => !n.isRead).length})`}
                    {filterKey === 'loan_status' && 'Loan Updates'}
                    {filterKey === 'repayment_deadline' && 'Repayments'}
                    {filterKey === 'announcement' && 'Announcements'}
                  </button>
                ))}
              </div>

              {/* Notifications List */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notifications
                  .filter((n) => {
                    if (notifFilter === 'unread') return !n.isRead;
                    if (notifFilter === 'loan_status') return n.category === 'loan_status';
                    if (notifFilter === 'repayment_deadline') return n.category === 'repayment_deadline';
                    if (notifFilter === 'announcement') return n.category === 'announcement';
                    return true;
                  })
                  .map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.isRead) markNotificationAsRead(notif.id);
                        if (notif.category === 'repayment_deadline') {
                          setActiveTab('repay');
                        } else if (notif.category === 'loan_status') {
                          setActiveTab('overview');
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        !notif.isRead
                          ? 'bg-blue-50/70 border-blue-200 shadow-xs'
                          : 'bg-slate-50/50 border-slate-200 opacity-90'
                      }`}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {notif.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400">
                          <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          {notif.fcmMessageId && (
                            <span className="text-emerald-700 font-mono">FCM Push Delivered</span>
                          )}
                        </div>
                      </div>

                      {notif.actionUrl && (
                        <span className="shrink-0 text-blue-700 text-xs font-bold hover:underline flex items-center gap-1 pt-1">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  ))}

                {notifications.length === 0 && (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <Bell className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="text-sm font-semibold text-slate-600">No notifications yet.</p>
                    <p className="text-xs">You will receive push updates here when loan actions take place.</p>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DIGITAL LOAN AGREEMENT SIGNING */}
      {/* ========================================================= */}
      {agreementModalApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Digital Loan Contract & Agreement
                </h3>
              </div>
              <button
                onClick={() => setAgreementModalApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Legal Agreement Text Box */}
            <div className="max-h-72 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
              <p className="font-bold text-slate-900 uppercase">
                KINGDOM OF LESOTHO • STUDENT MICROCREDIT AGREEMENT
              </p>
              <p>
                This Student Loan Agreement is entered into on <strong>{new Date().toLocaleDateString()}</strong> between <strong>POKOLA (Pty) Ltd</strong> ("Lender") and <strong>{currentUser.fullName}</strong> ("Borrower", Student ID: {currentUser.studentIdNumber}, {currentUser.institution}).
              </p>
              
              <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                <p>• Principal Loan Amount: <strong>{formatMaloti(agreementModalApp.requestedAmount)}</strong></p>
                <p>• Contract Monthly Simple Interest: <strong>25% (M{(agreementModalApp.requestedAmount * 0.25).toFixed(2)})</strong></p>
                <p>• Total Repayable Amount: <strong>{formatMaloti(agreementModalApp.totalRepayment)}</strong></p>
                <p>• Repayment Due Date: <strong>{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}</strong></p>
                <p>• Repayment Channel: <strong>Vodacom M-Pesa / Econet EcoCash ({currentUser.phone})</strong></p>
              </div>

              <p><strong>1. Repayment Obligation:</strong> The Borrower agrees unconditionally to repay the Total Repayable Amount on or before the specified Due Date.</p>
              <p><strong>2. Grace Period & Late Fees:</strong> A 3-day grace period is granted. Any default past the grace period incurs a 5% administrative penalty and may impair the student's eligibility for future loans.</p>
              <p><strong>3. Mobile Money Authorization:</strong> The Borrower warrants that the supplied mobile phone number belongs to them and consents to receiving automated SMS/WhatsApp payment reminder notifications.</p>
            </div>

            {/* Digital Signature Confirmation */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAcknowledged}
                  onChange={(e) => setAgreementAcknowledged(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded mt-0.5"
                />
                <span className="text-xs text-slate-800">
                  I have read, understood, and voluntarily accept all terms and conditions of this POKOLA Student Loan Agreement.
                </span>
              </label>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Type Full Legal Name as Digital Signature
                </label>
                <input
                  type="text"
                  value={agreementSignedName}
                  onChange={(e) => setAgreementSignedName(e.target.value)}
                  placeholder="e.g. Keketso Moteane"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setAgreementModalApp(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptAgreement}
                disabled={!agreementAcknowledged || !agreementSignedName.trim()}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase tracking-wider"
              >
                Sign & Activate Loan
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: OFFICIAL STUDENT LOAN STATEMENT */}
      {/* ========================================================= */}
      {statementLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-in fade-in">
            
            {/* Statement Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900 text-white font-black text-xl flex items-center justify-center">
                  P
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">POKOLA (Pty) Ltd</h3>
                  <p className="text-xs text-slate-500">Official Student Loan Statement • Maseru, Lesotho</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-slate-900">{statementLoan.loanNumber}</p>
                <p className="text-slate-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Borrower & Facility Information */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-900">{statementLoan.studentName}</p>
                <p className="text-slate-500">Student ID: {statementLoan.studentIdNumber}</p>
                <p className="text-slate-500">{statementLoan.institution}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-slate-600">Disbursed: <strong className="text-slate-900">{statementLoan.disbursedAt.split('T')[0]}</strong></p>
                <p className="text-slate-600">Repayment Deadline: <strong className="text-slate-900">{statementLoan.dueDate}</strong></p>
                <p className="text-slate-600">Status: <strong className="text-blue-700 uppercase">{statementLoan.status}</strong></p>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span>Principal Disbursed:</span>
                <span>{formatMaloti(statementLoan.principal)}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Contract Interest (25% Simple Rate):</span>
                <span>+{formatMaloti(statementLoan.interestAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-sm">
                <span>Total Repayable:</span>
                <span>{formatMaloti(statementLoan.totalRepayable)}</span>
              </div>
              <div className="flex justify-between text-emerald-300">
                <span>Total Repayments Recorded:</span>
                <span>-{formatMaloti(statementLoan.amountPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-bold text-sm text-rose-400">
                <span>Net Outstanding Balance:</span>
                <span>{formatMaloti(statementLoan.balance)}</span>
              </div>
            </div>

            {/* Installment schedule table */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-400">Installments Schedule</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Paid</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statementLoan.schedule.map((inst) => (
                      <tr key={inst.installmentNumber}>
                        <td className="p-2.5 font-bold">Installment {inst.installmentNumber}</td>
                        <td className="p-2.5">{inst.dueDate}</td>
                        <td className="p-2.5">{formatMaloti(inst.expectedAmount)}</td>
                        <td className="p-2.5 font-semibold text-emerald-700">{formatMaloti(inst.amountPaid)}</td>
                        <td className="p-2.5 uppercase font-bold text-[10px]">{inst.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Statement
              </button>

              <button
                onClick={() => setStatementLoan(null)}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECEIPT VIEW */}
      {/* ========================================================= */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Official Payment Receipt
              </div>
              <button onClick={() => setSelectedReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
              <span className="text-xs font-bold uppercase text-emerald-800">Amount Paid</span>
              <p className="text-3xl font-black text-emerald-950">{formatMaloti(selectedReceipt.amount)}</p>
              <p className="text-[11px] text-emerald-700 font-mono">Receipt: {selectedReceipt.receiptNumber}</p>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Borrower:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span>Loan Reference:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.loanNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Channel:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceipt.transactionReference}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span>{new Date(selectedReceipt.date).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Camera Profile Photo Capture Modal */}
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
        isDarkMode={false}
      />

    </div>
  );
};
