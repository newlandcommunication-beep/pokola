import React, { useState } from 'react';
import { 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Settings, 
  Shield, 
  TrendingUp, 
  Sparkles, 
  CreditCard, 
  Download, 
  Search, 
  Filter, 
  Send, 
  RefreshCw, 
  Eye, 
  Check, 
  X, 
  Calendar, 
  Building2, 
  FileSpreadsheet, 
  Sliders, 
  Activity, 
  RotateCcw,
  AlertCircle,
  Bell,
  BellRing,
  Radio,
  Megaphone,
  Smartphone,
  Trash2,
  Play,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  LoanApplication, 
  Loan, 
  BusinessSettings, 
  UserRole, 
  AnnouncementCategory, 
  AnnouncementPriority, 
  AnnouncementTargetAudience 
} from '../types';
import { formatMaloti, formatPercent, roundMoney } from '../utils/loanEngine';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    loans, 
    repayments, 
    settings, 
    auditLogs, 
    allUsers,
    notifications,
    announcements,
    fcmTokens,
    broadcastAnnouncement,
    deleteAnnouncement,
    reviewApplication, 
    recordRepayment, 
    updateLoanStatus,
    updateBusinessSettings, 
    triggerPaymentReminders, 
    simulateTestPushNotification,
    addNotification,
    exportCSV,
    resetDemoData
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kpi' | 'applications' | 'loans' | 'repayments' | 'reminders' | 'settings' | 'ai_insights' | 'audit'>('kpi');

  // Push Broadcast Form State
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastBody, setBroadcastBody] = useState<string>('');
  const [broadcastCategory, setBroadcastCategory] = useState<AnnouncementCategory>('general');
  const [broadcastPriority, setBroadcastPriority] = useState<AnnouncementPriority>('normal');
  const [broadcastTarget, setBroadcastTarget] = useState<AnnouncementTargetAudience>('all');
  const [broadcastCampus, setBroadcastCampus] = useState<string>('');
  const [selectedStudentForPush, setSelectedStudentForPush] = useState<string>('');
  const [targetedPushMsg, setTargetedPushMsg] = useState<string>('');

  // Application filter states
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appSearchQuery, setAppSearchQuery] = useState<string>('');
  const [selectedAppForReview, setSelectedAppForReview] = useState<LoanApplication | null>(null);
  const [reviewReason, setReviewReason] = useState<string>('');

  // Loan filter states
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('all');
  const [loanSearchQuery, setLoanSearchQuery] = useState<string>('');

  // Manual payment recording modal
  const [repayModalLoan, setRepayModalLoan] = useState<Loan | null>(null);
  const [manualPayAmount, setManualPayAmount] = useState<number>(0);
  const [manualPayMethod, setManualPayMethod] = useState<'mpesa' | 'ecocash' | 'bank_transfer' | 'cash'>('mpesa');
  const [manualPayRef, setManualPayRef] = useState<string>('');

  // Settings form state
  const [editSettings, setEditSettings] = useState<BusinessSettings>({ ...settings });

  // Audit log filter
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // AI Strategic Insights state
  const [aiInsightsText, setAiInsightsText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const isFullAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  // --- Portfolio Aggregates Calculations ---
  const totalAppsCount = applications.length;
  const pendingAppsCount = applications.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;
  const approvedAppsCount = applications.filter((a) => a.status === 'approved' || a.status === 'active').length;

  const totalLoansCount = loans.length;
  const activeLoansCount = loans.filter((l) => l.status === 'active' || l.status === 'partially_paid').length;
  const overdueLoansCount = loans.filter((l) => l.status === 'overdue').length;
  const settledLoansCount = loans.filter((l) => l.status === 'fully_paid').length;

  const totalPrincipalDisbursed = loans.reduce((acc, l) => acc + l.principal, 0);
  const totalInterestAccrued = loans.reduce((acc, l) => acc + l.interestAmount, 0);
  const totalRepaymentsCollected = repayments.reduce((acc, r) => acc + r.amount, 0);
  const totalOutstandingBalance = loans.reduce((acc, l) => acc + l.balance, 0);

  const collectionRate = totalPrincipalDisbursed > 0 
    ? ((totalRepaymentsCollected / (totalPrincipalDisbursed + totalInterestAccrued)) * 100).toFixed(1)
    : '0';

  // Filtered Applications
  const filteredApps = applications.filter((app) => {
    const matchesStatus = appStatusFilter === 'all' || app.status === appStatusFilter;
    const matchesSearch = 
      app.studentName.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
      app.institution.toLowerCase().includes(appSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Loans
  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = loanStatusFilter === 'all' || loan.status === loanStatusFilter;
    const matchesSearch = 
      loan.studentName.toLowerCase().includes(loanSearchQuery.toLowerCase()) ||
      loan.loanNumber.toLowerCase().includes(loanSearchQuery.toLowerCase()) ||
      loan.institution.toLowerCase().includes(loanSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    return (
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase())
    );
  });

  // Handle Review Submission
  const handleReviewDecision = (decision: 'approved' | 'rejected' | 'under_review') => {
    if (!selectedAppForReview) return;
    reviewApplication(selectedAppForReview.id, decision, reviewReason);
    setSelectedAppForReview(null);
    setReviewReason('');
  };

  // Handle Manual Payment Save
  const handleSaveManualPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayModalLoan) return;
    recordRepayment({
      loanId: repayModalLoan.id,
      amount: manualPayAmount,
      paymentMethod: manualPayMethod,
      transactionReference: manualPayRef,
      notes: `Recorded by Officer ${currentUser?.fullName}`,
    });
    setRepayModalLoan(null);
    setManualPayAmount(0);
    setManualPayRef('');
  };

  // Handle Settings Save
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings(editSettings);
  };

  // Fetch AI Strategic Insights
  const handleGenerateAiInsights = async () => {
    setAiLoading(true);
    try {
      const resp = await fetch('/api/ai/admin-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioMetrics: {
            totalApplications: totalAppsCount,
            pendingApplications: pendingAppsCount,
            totalLoansCount,
            activeLoansCount,
            overdueLoansCount,
            settledLoansCount,
            totalPrincipalDisbursed,
            totalInterestAccrued,
            totalRepaymentsCollected,
            totalOutstandingBalance,
            repaymentRate: `${collectionRate}%`,
            monthlyInterestRate: formatPercent(settings.monthlyInterestRate),
            maxLoanAmount: settings.maxLoanAmount,
          },
        }),
      });
      const data = await resp.json();
      setAiInsightsText(data.insights || 'Analysis completed.');
    } catch (err) {
      console.error(err);
      setAiInsightsText('Could not generate AI insights at this moment.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Management Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {currentUser?.role === 'loan_officer' ? 'Loan Officer Portal' : 'Executive Management & Administration'}
            </span>
            <span className="text-xs text-slate-400">• Lesotho Central Operations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            POKOLA Lending Administration
          </h1>
          <p className="text-xs text-slate-500">
            Signed in as <strong className="text-slate-800">{currentUser?.fullName}</strong> ({currentUser?.email})
          </p>
        </div>

        {/* Global Quick Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => triggerPaymentReminders()}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5"
            title="Dispatch payment reminders to all active borrowers"
          >
            <Send className="w-3.5 h-3.5" /> Send Reminders Batch
          </button>

          <button
            onClick={() => exportCSV('loans')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Portfolio CSV
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        <button
          onClick={() => setActiveTab('kpi')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'kpi'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Overview & Metrics
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'applications'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Loan Applications
          {pendingAppsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black">
              {pendingAppsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'loans'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Active Loans & Recovery
          {overdueLoansCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {overdueLoansCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('repayments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'repayments'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Repayment Receipts
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reminders'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-3.5 h-3.5 text-amber-500" /> Push Alerts & FCM Hub
          {announcements.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
              {announcements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ai_insights')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'ai_insights'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Risk Strategist
        </button>

        {isFullAdmin && (
          <>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Lending Configuration
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'audit'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Immutable Audit Trail
            </button>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. OVERVIEW & METRICS TAB */}
      {/* ========================================================= */}
      {activeTab === 'kpi' && (
        <div className="space-y-8">
          
          {/* Top 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Disbursed</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-black text-slate-900">
                {formatMaloti(totalPrincipalDisbursed)}
              </p>
              <p className="text-[11px] text-slate-500">
                Across {totalLoansCount} student loans
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Repayments Collected</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-black text-emerald-700">
                {formatMaloti(totalRepaymentsCollected)}
              </p>
              <p className="text-[11px] text-emerald-700 font-semibold">
                Collection rate: {collectionRate}%
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Net Outstanding Balance</span>
                <CreditCard className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-black text-purple-900">
                {formatMaloti(totalOutstandingBalance)}
              </p>
              <p className="text-[11px] text-slate-500">
                Principal + {formatPercent(settings.monthlyInterestRate)} accrued interest
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Delinquency / Overdue</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black text-rose-700">
                {overdueLoansCount} loans
              </p>
              <p className="text-[11px] text-rose-600 font-semibold">
                {((overdueLoansCount / (totalLoansCount || 1)) * 100).toFixed(0)}% of loan portfolio
              </p>
            </div>

          </div>

          {/* Breakdown by Institution & Status Visualizers */}
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Institution Exposure Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Portfolio Exposure by Institution
              </h3>

              <div className="space-y-3 pt-2">
                {['National University of Lesotho (NUL)', 'Limkokwing University of Creative Technology (LUCT)', 'Lerotholi Polytechnic (LP)', 'Botho University Lesotho', 'Centre for Accounting Studies (CAS)'].map((inst) => {
                  const instLoans = loans.filter((l) => l.institution.includes(inst.split(' ')[0]));
                  const instDisbursed = instLoans.reduce((acc, l) => acc + l.principal, 0);
                  const percent = totalPrincipalDisbursed > 0 ? (instDisbursed / totalPrincipalDisbursed) * 100 : 0;

                  return (
                    <div key={inst} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-800">{inst.split('(')[0]}</span>
                        <span className="text-slate-900 font-bold">{formatMaloti(instDisbursed)} ({percent.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Pipeline Status */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" /> Application Pipeline & Status
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Pending Review</span>
                  <span className="text-2xl font-black text-amber-600">{pendingAppsCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Approved & Disbursed</span>
                  <span className="text-2xl font-black text-blue-700">{approvedAppsCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Fully Settled</span>
                  <span className="text-2xl font-black text-emerald-700">{settledLoansCount}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block">Registered Students</span>
                  <span className="text-2xl font-black text-slate-900">{allUsers.filter((u) => u.role === 'student').length}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <p className="font-bold">Automated Lending Parameters Active</p>
                  <p className="text-[11px] text-blue-700">Monthly Rate: {formatPercent(settings.monthlyInterestRate)} • Max Cap: {formatMaloti(settings.maxLoanAmount, false)} • Term: 30 Days</p>
                </div>
                {isFullAdmin && (
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="px-3 py-1.5 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs"
                  >
                    Adjust
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. LOAN APPLICATIONS TAB */}
      {/* ========================================================= */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student or app number..."
                  value={appSearchQuery}
                  onChange={(e) => setAppSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="active">Active Loan</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Showing {filteredApps.length} of {applications.length} applications
            </span>
          </div>

          {/* Applications Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">App #</th>
                    <th className="p-4">Student Name</th>
                    <th className="p-4">Institution</th>
                    <th className="p-4">Requested</th>
                    <th className="p-4">Interest (25%)</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Risk Rating</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{app.applicationNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{app.studentName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">ID: {app.studentIdNumber}</p>
                      </td>
                      <td className="p-4 text-slate-600">{app.institution.split('(')[0]}</td>
                      <td className="p-4 font-bold text-slate-900">{formatMaloti(app.requestedAmount)}</td>
                      <td className="p-4 font-semibold text-emerald-700">+{formatMaloti(app.calculatedInterest)}</td>
                      <td className="p-4 font-bold text-blue-950">{formatMaloti(app.totalRepayment)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          app.riskEvaluation?.riskLevel === 'low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.riskEvaluation?.riskLevel === 'moderate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {app.riskEvaluation?.riskLevel || 'Low'} ({app.riskEvaluation?.riskScore || 85}/100)
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'submitted'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'active'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {app.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedAppForReview(app)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ACTIVE LOANS & RECOVERY TAB */}
      {/* ========================================================= */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search borrower or loan code..."
                  value={loanSearchQuery}
                  onChange={(e) => setLoanSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <select
                value={loanStatusFilter}
                onChange={(e) => setLoanStatusFilter(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Loans</option>
                <option value="active">Active</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="fully_paid">Fully Paid</option>
              </select>
            </div>

            <button
              onClick={() => exportCSV('loans')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Download Ledger
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">Loan #</th>
                    <th className="p-4">Student Borrower</th>
                    <th className="p-4">Principal</th>
                    <th className="p-4">Interest (25%)</th>
                    <th className="p-4">Total Repayable</th>
                    <th className="p-4">Paid</th>
                    <th className="p-4">Balance</th>
                    <th className="p-4">Due Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLoans.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{l.loanNumber}</td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{l.studentName}</p>
                        <p className="text-[10px] text-slate-500">{l.institution.split('(')[0]} • {l.studentPhone}</p>
                      </td>
                      <td className="p-4 font-semibold text-slate-900">{formatMaloti(l.principal)}</td>
                      <td className="p-4 font-semibold text-emerald-700">+{formatMaloti(l.interestAmount)}</td>
                      <td className="p-4 font-bold text-slate-900">{formatMaloti(l.totalRepayable)}</td>
                      <td className="p-4 font-semibold text-emerald-700">{formatMaloti(l.amountPaid)}</td>
                      <td className="p-4 font-black text-rose-700">{formatMaloti(l.balance)}</td>
                      <td className="p-4 font-semibold text-slate-700">{l.dueDate}</td>
                      <td className="p-4">
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
                      <td className="p-4 text-right">
                        {l.balance > 0 && (
                          <button
                            onClick={() => {
                              setRepayModalLoan(l);
                              setManualPayAmount(l.balance);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. REPAYMENTS RECEIPTS TAB */}
      {/* ========================================================= */}
      {activeTab === 'repayments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Central Repayment Transactions Ledger
              </h3>
              <button
                onClick={() => exportCSV('repayments')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Receipts CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Loan Reference</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Payment Method</th>
                    <th className="p-3.5">Transaction Code</th>
                    <th className="p-3.5">Date & Time</th>
                    <th className="p-3.5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {repayments.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-bold text-slate-900">{rep.receiptNumber}</td>
                      <td className="p-3.5 font-bold text-blue-700">{rep.loanNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-900">{rep.studentName}</td>
                      <td className="p-3.5 font-black text-emerald-700">{formatMaloti(rep.amount)}</td>
                      <td className="p-3.5 uppercase font-bold text-[11px]">{rep.paymentMethod}</td>
                      <td className="p-3.5 font-mono text-slate-700">{rep.transactionReference}</td>
                      <td className="p-3.5 text-slate-600">{new Date(rep.date).toLocaleString()}</td>
                      <td className="p-3.5 text-slate-600">{rep.recordedByName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. AI RISK STRATEGIST TAB */}
      {/* ========================================================= */}
      {activeTab === 'ai_insights' && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs max-w-4xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-900 text-amber-300 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">POKOLA Credit Risk & Portfolio AI</h3>
                <p className="text-xs text-slate-500">Autonomous risk assessment using Gemini 3.7 Flash</p>
              </div>
            </div>

            <button
              onClick={handleGenerateAiInsights}
              disabled={aiLoading}
              className="px-6 py-3 bg-purple-900 hover:bg-purple-800 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              {aiLoading ? 'Analyzing Portfolio...' : 'Generate Risk Analysis Report'}
            </button>
          </div>

          {aiInsightsText ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans space-y-4">
              {aiInsightsText}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-purple-300" />
              <p className="text-sm font-semibold text-slate-600">No report generated yet.</p>
              <p className="text-xs">Click above to analyze current loan volume, recovery rates, and institutional risk distribution.</p>
            </div>
          )}

        </div>
      )}

      {/* ========================================================= */}
      {/* 5b. PUSH NOTIFICATIONS & ADMINISTRATIVE ALERTS HUB */}
      {/* ========================================================= */}
      {activeTab === 'reminders' && (
        <div className="space-y-8">
          
          {/* Top Push Engine Status Banner */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white border border-blue-900/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Firebase Cloud Messaging Live
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  {fcmTokens.length} Registered Devices
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                POKOLA Push Notification & Broadcast Service
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Automate loan status updates, repayment deadline alerts (due in 7d, 3d, 1d, overdue), and broadcast administrative campus announcements directly to student mobile devices.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={() => triggerPaymentReminders()}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Trigger Repayment Reminders Batch</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Left Column: Broadcast Announcement Composer (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Broadcast Administrative Alert</h3>
                    <p className="text-xs text-slate-500">Sends instant FCM push alerts & in-app notices</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  Officer Dispatch
                </span>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!broadcastTitle.trim() || !broadcastBody.trim()) return;
                  broadcastAnnouncement({
                    title: broadcastTitle,
                    body: broadcastBody,
                    category: broadcastCategory,
                    priority: broadcastPriority,
                    targetAudience: broadcastTarget,
                    targetCampus: broadcastTarget === 'specific_campus' ? broadcastCampus : undefined,
                  });
                  setBroadcastTitle('');
                  setBroadcastBody('');
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                    Announcement Headline / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NUL Semester 2 Loan Application Window Extended"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                    Alert Message Content *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide detailed notice, instructions, or deadlines for students..."
                    value={broadcastBody}
                    onChange={(e) => setBroadcastBody(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                      Category
                    </label>
                    <select
                      value={broadcastCategory}
                      onChange={(e) => setBroadcastCategory(e.target.value as AnnouncementCategory)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="general">General Notice</option>
                      <option value="deadline">Repayment Deadline</option>
                      <option value="policy">Policy & Terms</option>
                      <option value="maintenance">System Service</option>
                      <option value="bursary">Bursary & NSFAS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={broadcastPriority}
                      onChange={(e) => setBroadcastPriority(e.target.value as AnnouncementPriority)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent / Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                      Target Audience
                    </label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as AnnouncementTargetAudience)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    >
                      <option value="all">All Registered Students</option>
                      <option value="active_borrowers">Active Borrowers</option>
                      <option value="overdue">Overdue Borrowers</option>
                      <option value="specific_campus">Specific Campus</option>
                    </select>
                  </div>
                </div>

                {broadcastTarget === 'specific_campus' && (
                  <div className="animate-in fade-in">
                    <label className="text-xs font-bold uppercase text-slate-700 block mb-1.5">
                      Select University / Institution Campus
                    </label>
                    <select
                      value={broadcastCampus}
                      onChange={(e) => setBroadcastCampus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                      required
                    >
                      <option value="">-- Choose Campus --</option>
                      <option value="National University of Lesotho">National University of Lesotho (NUL - Roma)</option>
                      <option value="Lerotholi Polytechnic">Lerotholi Polytechnic (Fokothi)</option>
                      <option value="Centre for Accounting Studies">Centre for Accounting Studies (CAS)</option>
                      <option value="Limkokwing University">Limkokwing University of Creative Technology</option>
                      <option value="Botho University">Botho University Maseru</option>
                    </select>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Broadcast Push Notification</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Direct Student Push & Active Announcements (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Direct Targeted Push Test Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Smartphone className="w-5 h-5 text-purple-600" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Direct Student Push Test</h3>
                    <p className="text-[11px] text-slate-500">Dispatch test trigger to any student device</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Select Student Account
                    </label>
                    <select
                      value={selectedStudentForPush}
                      onChange={(e) => setSelectedStudentForPush(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    >
                      <option value="">-- Choose Student --</option>
                      {allUsers.filter((u) => u.role === 'student').map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} ({s.institution.split('(')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Custom Alert Message
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Please verify your second semester bursary slip"
                      value={targetedPushMsg}
                      onChange={(e) => setTargetedPushMsg(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={!selectedStudentForPush}
                      onClick={() => {
                        const targetStudent = allUsers.find((u) => u.id === selectedStudentForPush);
                        if (!targetStudent) return;
                        addNotification(
                          targetStudent.id,
                          'POKOLA Direct Officer Alert',
                          targetedPushMsg.trim() || 'Please check your loan application status in the POKOLA student portal.',
                          'info',
                          'system'
                        );
                        setTargetedPushMsg('');
                      }}
                      className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3 h-3" /> Send Direct Push
                    </button>
                  </div>
                </div>
              </div>

              {/* FCM Device Registry Stats */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-500" />
                    Registered FCM Device Tokens ({fcmTokens.length})
                  </h3>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Handshake
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                  {fcmTokens.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{t.userName}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {t.deviceType.toUpperCase()} • {t.token.slice(0, 22)}...
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(t.lastUpdated).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                  {fcmTokens.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No device tokens registered yet.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Past Announcements & Broadcasts Feed */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Broadcast Dispatch History</h3>
                <p className="text-xs text-slate-500">All administrative messages transmitted to students</p>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {announcements.length} Total Broadcasts
              </span>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((anc) => (
                <div key={anc.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        anc.priority === 'urgent'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : anc.priority === 'high'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {anc.priority} priority
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(anc.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">
                      {anc.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {anc.body}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Target: <strong>{anc.targetAudience.replace('_', ' ')}</strong></span>
                    <button
                      type="button"
                      onClick={() => deleteAnnouncement(anc.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Delete Announcement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 6. LENDING SETTINGS CONFIGURATION (Admin Only) */}
      {/* ========================================================= */}
      {activeTab === 'settings' && isFullAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-1 pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              System Parameters
            </span>
            <h2 className="text-2xl font-black text-slate-900">
              Configurable Lending & Risk Rules
            </h2>
            <p className="text-xs text-slate-500">
              All modifications apply platform-wide immediately and are logged to the immutable audit trail.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Maximum Loan Amount (Maloti)
                </label>
                <input
                  type="number"
                  min={100}
                  max={5000}
                  step={50}
                  value={editSettings.maxLoanAmount}
                  onChange={(e) => setEditSettings({ ...editSettings, maxLoanAmount: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Monthly Simple Interest Rate (Decimal)
                </label>
                <input
                  type="number"
                  min={0.05}
                  max={0.50}
                  step={0.01}
                  value={editSettings.monthlyInterestRate}
                  onChange={(e) => setEditSettings({ ...editSettings, monthlyInterestRate: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current: {(editSettings.monthlyInterestRate * 100).toFixed(0)}% per month
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Default Term (Days)
                </label>
                <input
                  type="number"
                  min={7}
                  max={90}
                  value={editSettings.defaultRepaymentPeriodDays}
                  onChange={(e) => setEditSettings({ ...editSettings, defaultRepaymentPeriodDays: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Late Fee Penalty (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  value={editSettings.lateFeePercent}
                  onChange={(e) => setEditSettings({ ...editSettings, lateFeePercent: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Grace Period (Days)
                </label>
                <input
                  type="number"
                  min={0}
                  max={14}
                  value={editSettings.gracePeriodDays}
                  onChange={(e) => setEditSettings({ ...editSettings, gracePeriodDays: Number(e.target.value) })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                  Support Contact Phone (Lesotho)
                </label>
                <input
                  type="text"
                  value={editSettings.contactSupportPhone}
                  onChange={(e) => setEditSettings({ ...editSettings, contactSupportPhone: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditSettings({ ...settings })}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md uppercase tracking-wider"
              >
                Save Settings
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ========================================================= */}
      {/* 7. IMMUTABLE AUDIT TRAIL TAB (Admin Only) */}
      {/* ========================================================= */}
      {activeTab === 'audit' && isFullAdmin && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" /> Immutable Platform Audit Logs
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloud Firestore Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tamper-proof compliance log capturing all administrative decisions, loan changes, and repayments in Cloud Firestore.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search audit actions..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
              <button
                onClick={() => exportCSV('audit')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Export Audit CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 font-sans">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Entity</th>
                  <th className="p-3.5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3.5 font-sans font-bold text-slate-900">
                      {log.userName} <span className="text-[10px] text-slate-400 font-normal">({log.userRole})</span>
                    </td>
                    <td className="p-3.5 font-bold text-blue-700">{log.action}</td>
                    <td className="p-3.5 text-slate-600">{log.affectedRecordType}</td>
                    <td className="p-3.5 font-sans text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* REVIEW APPLICATION MODAL */}
      {/* ========================================================= */}
      {selectedAppForReview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 my-8 animate-in fade-in">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Officer Review: {selectedAppForReview.applicationNumber}
                </h3>
              </div>
              <button onClick={() => setSelectedAppForReview(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Dossier */}
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                <p className="font-bold text-slate-900 text-sm">{selectedAppForReview.studentName}</p>
                <p className="text-slate-500">Student ID: {selectedAppForReview.studentIdNumber}</p>
                <p className="text-slate-500">{selectedAppForReview.institution}</p>
                <p className="text-slate-500">{selectedAppForReview.studentPhone} • {selectedAppForReview.studentEmail}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                <p className="text-slate-500">Requested: <strong className="text-slate-900 font-bold">{formatMaloti(selectedAppForReview.requestedAmount)}</strong></p>
                <p className="text-slate-500">Interest (25%): <strong className="text-emerald-700 font-bold">+{formatMaloti(selectedAppForReview.calculatedInterest)}</strong></p>
                <p className="text-slate-500">Total Repayable: <strong className="text-slate-900 font-bold">{formatMaloti(selectedAppForReview.totalRepayment)}</strong></p>
                <p className="text-slate-500">Purpose: <strong className="text-slate-800">{selectedAppForReview.purpose}</strong></p>
              </div>
            </div>

            {/* Risk Assessment Score Card */}
            {selectedAppForReview.riskEvaluation && (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300 uppercase">Automated Credit Risk Assessment</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedAppForReview.riskEvaluation.riskLevel === 'low'
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-amber-400 text-slate-950'
                  }`}>
                    {selectedAppForReview.riskEvaluation.riskLevel} Risk ({selectedAppForReview.riskEvaluation.riskScore}/100)
                  </span>
                </div>
                <div className="space-y-1 text-slate-300 text-[11px] pt-1">
                  {selectedAppForReview.riskEvaluation.factors.map((factor, idx) => (
                    <p key={idx}>• {factor}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Officer Notes Input */}
            <div>
              <label className="text-xs font-bold uppercase text-slate-700 block mb-1">
                Loan Officer Notes / Rejection Reason (Mandatory if Rejecting)
              </label>
              <textarea
                rows={2}
                value={reviewReason}
                onChange={(e) => setReviewReason(e.target.value)}
                placeholder="e.g. Student enrollment confirmed with Registrar. Approved for standard 30-day loan."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
            </div>

            {/* Decision Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => handleReviewDecision('under_review')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Mark Under Review
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReviewDecision('rejected')}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleReviewDecision('approved')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Approve Application
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MANUAL PAYMENT RECORDING MODAL */}
      {/* ========================================================= */}
      {repayModalLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Record Repayment: {repayModalLoan.loanNumber}
              </h3>
              <button onClick={() => setRepayModalLoan(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualPayment} className="space-y-4 text-xs">
              <div>
                <p className="text-slate-500">Borrower: <strong className="text-slate-900">{repayModalLoan.studentName}</strong></p>
                <p className="text-slate-500">Current Balance: <strong className="text-rose-700 font-bold">{formatMaloti(repayModalLoan.balance)}</strong></p>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Amount (Maloti)</label>
                <input
                  type="number"
                  min={10}
                  max={repayModalLoan.balance}
                  value={manualPayAmount || ''}
                  onChange={(e) => setManualPayAmount(Number(e.target.value))}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={manualPayMethod}
                  onChange={(e) => setManualPayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold"
                >
                  <option value="mpesa">Vodacom M-Pesa</option>
                  <option value="ecocash">Econet EcoCash</option>
                  <option value="bank_transfer">Bank Transfer (Standard Lesotho/FNB)</option>
                  <option value="cash">Cash Settlement</option>
                </select>
              </div>

              <div>
                <label className="font-bold uppercase text-slate-700 block mb-1">Transaction Ref / Receipt Code</label>
                <input
                  type="text"
                  value={manualPayRef}
                  onChange={(e) => setManualPayRef(e.target.value.toUpperCase())}
                  placeholder="e.g. MP-84912"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRepayModalLoan(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
