import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  FileText, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  ArrowUpRight, 
  Smartphone, 
  Percent, 
  Zap, 
  RotateCcw,
  Sliders,
  Calendar,
  Layers,
  Award
} from 'lucide-react';
import { Loan, Repayment } from '../types';
import { formatMaloti, formatPercent, roundMoney } from '../utils/loanEngine';

/**
 * Circular Progress Bar SVG Component with animated dashoffset and gradient stroke
 */
interface CircularProgressBarProps {
  percentage: number; // 0 to 100
  size?: number; // width & height in px
  strokeWidth?: number;
  status?: 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'preview';
  centerLabel?: string;
  centerSubLabel?: string;
  children?: React.ReactNode;
}

export const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  status = 'active',
  centerLabel,
  centerSubLabel,
  children
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Choose gradient & theme colors based on status and progress
  const gradientId = `circle-grad-${status}-${Math.round(clampedPercent)}`;
  
  let gradStart = '#3b82f6';
  let gradEnd = '#10b981';
  let trackColor = 'rgba(255, 255, 255, 0.12)';
  let glowColor = 'rgba(16, 185, 129, 0.2)';

  if (status === 'overdue') {
    gradStart = '#f59e0b';
    gradEnd = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.25)';
  } else if (status === 'fully_paid' || clampedPercent >= 100) {
    gradStart = '#10b981';
    gradEnd = '#059669';
    glowColor = 'rgba(16, 185, 129, 0.35)';
  } else if (clampedPercent < 30) {
    gradStart = '#60a5fa';
    gradEnd = '#2563eb';
    glowColor = 'rgba(37, 99, 235, 0.2)';
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="transform -rotate-90 transition-transform duration-500"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id={`glow-${gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{
            filter: clampedPercent > 0 ? `drop-shadow(0 0 6px ${glowColor})` : 'none'
          }}
        />
      </svg>

      {/* Center Label Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
        {children ? (
          children
        ) : (
          <>
            <span className="text-2xl font-black text-white tracking-tight leading-none">
              {Math.round(clampedPercent)}%
            </span>
            {centerLabel && (
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mt-0.5">
                {centerLabel}
              </span>
            )}
            {centerSubLabel && (
              <span className="text-[9px] text-slate-300 font-medium">
                {centerSubLabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface LoanStatusTrackerProps {
  loan?: Loan | null;
  allStudentLoans?: Loan[];
  repayments?: Repayment[];
  onPayNow?: (loan: Loan, amount: number) => void;
  onViewStatement?: (loan: Loan) => void;
  onApplyNew?: () => void;
  onOpenCalculator?: () => void;
  className?: string;
}

export const LoanStatusTracker: React.FC<LoanStatusTrackerProps> = ({
  loan,
  allStudentLoans = [],
  repayments = [],
  onPayNow,
  onViewStatement,
  onApplyNew,
  onOpenCalculator,
  className = ''
}) => {
  // Allow toggling between active loan and historical loans if multiple exist
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(loan ? loan.id : null);
  const [simulationPayAmount, setSimulationPayAmount] = useState<number>(0);
  const [showPayoffSimulator, setShowPayoffSimulator] = useState<boolean>(false);

  // Sync selected loan
  const currentLoan = useMemo(() => {
    if (selectedLoanId && allStudentLoans.length > 0) {
      const found = allStudentLoans.find((l) => l.id === selectedLoanId);
      if (found) return found;
    }
    return loan || (allStudentLoans.length > 0 ? allStudentLoans[0] : null);
  }, [selectedLoanId, allStudentLoans, loan]);

  // Compute live repayment metrics
  const metrics = useMemo(() => {
    if (!currentLoan) return null;

    const totalRepayable = currentLoan.totalRepayable || (currentLoan.principal + currentLoan.interestAmount);
    const amountPaid = currentLoan.amountPaid || 0;
    const currentBalance = Math.max(0, totalRepayable - amountPaid);
    
    // Calculate progress percentage
    const baseProgressPercent = totalRepayable > 0 
      ? Math.min(100, Math.round((amountPaid / totalRepayable) * 100))
      : 0;

    // Simulated progress if user adjusts simulator slider
    const effectiveSimPaid = Math.min(totalRepayable, amountPaid + simulationPayAmount);
    const simProgressPercent = totalRepayable > 0
      ? Math.min(100, Math.round((effectiveSimPaid / totalRepayable) * 100))
      : 0;
    const simRemainingBalance = Math.max(0, totalRepayable - effectiveSimPaid);

    // Repaid Principal vs Repaid Interest proportion estimation
    const principalPortion = currentLoan.principal || 0;
    const interestPortion = currentLoan.interestAmount || 0;
    
    // Count verified repayments for this loan
    const loanRepayments = repayments.filter((r) => r.loanId === currentLoan.id);
    const confirmedPaymentsCount = loanRepayments.length;

    // Days remaining till due date
    let daysLeft = 0;
    let isOverdue = currentLoan.status === 'overdue';
    if (currentLoan.dueDate) {
      const dueTime = new Date(currentLoan.dueDate).getTime();
      const nowTime = new Date().getTime();
      const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
      daysLeft = diffDays;
      if (diffDays < 0 && currentBalance > 0) {
        isOverdue = true;
      }
    }

    // Determine status badge
    let displayStatus: 'active' | 'partially_paid' | 'fully_paid' | 'overdue' = 'active';
    if (currentBalance === 0 || currentLoan.status === 'fully_paid') {
      displayStatus = 'fully_paid';
    } else if (isOverdue) {
      displayStatus = 'overdue';
    } else if (amountPaid > 0) {
      displayStatus = 'partially_paid';
    }

    // Schedule breakdown
    const scheduleItems = currentLoan.schedule || [];
    const completedInstallments = scheduleItems.filter((s) => s.status === 'paid').length;
    const totalInstallments = scheduleItems.length || (currentLoan.repaymentPeriodDays > 30 ? 2 : 1);
    const nextInstallment = scheduleItems.find((s) => s.status === 'upcoming' || s.status === 'due' || s.status === 'partially_paid');

    return {
      totalRepayable,
      amountPaid,
      currentBalance,
      baseProgressPercent,
      simProgressPercent,
      simRemainingBalance,
      effectiveSimPaid,
      principalPortion,
      interestPortion,
      confirmedPaymentsCount,
      daysLeft,
      isOverdue,
      displayStatus,
      completedInstallments,
      totalInstallments,
      nextInstallment
    };
  }, [currentLoan, repayments, simulationPayAmount]);

  // If no loan exists at all (user has no active or past loans)
  if (!currentLoan || !metrics) {
    return (
      <div className={`bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-5 rounded-3xl shadow-md border border-white/10 relative overflow-hidden space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 border border-blue-400/20">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Loan Status & Credit Tracker
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
            Available Limit: M1,500
          </span>
        </div>

        {/* Circular Credit Readiness Meter */}
        <div className="flex items-center gap-4 py-2">
          <CircularProgressBar
            percentage={100}
            size={110}
            strokeWidth={10}
            status="fully_paid"
          >
            <div className="text-center">
              <span className="text-xs font-black text-white block">100%</span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase block">Credit Ready</span>
            </div>
          </CircularProgressBar>

          <div className="flex-1 space-y-1.5">
            <h4 className="text-sm font-black text-white leading-tight">No Active Loan Balance</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              You have a clean borrowing record. You can apply for up to <strong>M1,500</strong> for textbooks, tuition, or campus living.
            </p>
            <div className="flex items-center gap-2 text-[10px] text-blue-200 pt-1">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 25% Fixed Rate
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-300" /> Instant M-Pesa
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
          {onApplyNew && (
            <button
              onClick={onApplyNew}
              className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <span>Apply for Loan</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenCalculator && (
            <button
              onClick={onOpenCalculator}
              className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Loan Calculator</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active or Historic Loan view with Circular Tracker
  const activePercent = showPayoffSimulator ? metrics.simProgressPercent : metrics.baseProgressPercent;
  const isFullySettled = metrics.displayStatus === 'fully_paid';

  return (
    <div className={`bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-5 rounded-3xl shadow-md border border-white/10 relative overflow-hidden space-y-4 ${className}`}>
      
      {/* 1. Header with Loan ID & Dynamic Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-300 border border-blue-400/20">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Loan Tracker
              </span>
              <span className="text-[10px] text-blue-300 font-bold">
                #{currentLoan.loanNumber}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block">
              Disbursed: {currentLoan.disbursedAt || 'Active'}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {metrics.displayStatus === 'fully_paid' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>PAID IN FULL</span>
            </span>
          )}

          {metrics.displayStatus === 'overdue' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>OVERDUE ({Math.abs(metrics.daysLeft)}d)</span>
            </span>
          )}

          {metrics.displayStatus === 'partially_paid' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/40 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>IN PROGRESS ({activePercent}%)</span>
            </span>
          )}

          {metrics.displayStatus === 'active' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/20 text-slate-300 border border-slate-400/30 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>ACTIVE (0% Repaid)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Multi-Loan Switcher (if student has more than 1 loan in history) */}
      {allStudentLoans.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Loans:</span>
          {allStudentLoans.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setSelectedLoanId(l.id);
                setSimulationPayAmount(0);
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 transition-all ${
                currentLoan.id === l.id
                  ? 'bg-blue-600 text-white shadow-2xs border border-blue-400'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20 border border-white/5'
              }`}
            >
              #{l.loanNumber} ({formatMaloti(l.balance === 0 ? l.totalRepayable : l.balance)})
            </button>
          ))}
        </div>
      )}

      {/* 3. Core Tracker Section: Circular Progress Meter + Balance Metrics */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
        
        {/* Circular Progress Bar Component */}
        <div className="shrink-0">
          <CircularProgressBar
            percentage={activePercent}
            size={116}
            strokeWidth={11}
            status={metrics.displayStatus}
            centerLabel={isFullySettled ? 'Settled' : 'Repaid'}
            centerSubLabel={`${formatMaloti(showPayoffSimulator ? metrics.effectiveSimPaid : metrics.amountPaid)}`}
          />
        </div>

        {/* Repayment Progress vs Total Loan Amount Breakdown */}
        <div className="flex-1 space-y-2">
          
          {/* Outstanding Balance */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isFullySettled ? 'Final Settlement' : 'Remaining Balance'}
            </span>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">
              {formatMaloti(showPayoffSimulator ? metrics.simRemainingBalance : metrics.currentBalance)}
            </div>
          </div>

          {/* Progress vs Total Loan Amount Sub-Stats */}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span>Repaid to Date:</span>
              <strong className="text-emerald-300 font-black">
                {formatMaloti(showPayoffSimulator ? metrics.effectiveSimPaid : metrics.amountPaid)}
              </strong>
            </div>

            <div className="flex justify-between items-center text-slate-300 text-[11px]">
              <span>Total Repayable:</span>
              <strong className="text-white font-bold">
                {formatMaloti(metrics.totalRepayable)}
              </strong>
            </div>
          </div>

          {/* Due Date Indicator */}
          {!isFullySettled && (
            <div className="pt-1 flex items-center justify-between text-[10px] text-blue-200">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-300" />
                <span>Due: <strong>{currentLoan.dueDate}</strong></span>
              </span>
              <span className={`font-bold ${metrics.daysLeft <= 3 ? 'text-amber-300' : 'text-slate-300'}`}>
                {metrics.daysLeft > 0 ? `${metrics.daysLeft} days left` : metrics.daysLeft === 0 ? 'Due Today' : 'Past Due'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Principal vs Interest Composition & Milestone Breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Principal Borrowed</span>
          <strong className="text-xs text-white font-black">{formatMaloti(metrics.principalPortion)}</strong>
          <span className="text-[9px] text-blue-200 block">Original Loan Amount</span>
        </div>

        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 space-y-0.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase block">Interest Charge</span>
          <strong className="text-xs text-amber-300 font-black">
            +{formatMaloti(metrics.interestPortion)}
          </strong>
          <span className="text-[9px] text-amber-200 block">
            {formatPercent(currentLoan.monthlyInterestRate || 0.25)} monthly rate
          </span>
        </div>
      </div>

      {/* 5. Installment Cadence / Milestone Indicator */}
      {metrics.totalInstallments > 1 && (
        <div className="bg-white/5 rounded-xl p-2.5 border border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-blue-300" />
            <div>
              <span className="text-[11px] font-bold text-white block">
                Bi-Weekly Installments ({metrics.completedInstallments}/{metrics.totalInstallments} Complete)
              </span>
              <span className="text-[9px] text-slate-400">
                {metrics.nextInstallment 
                  ? `Next due: ${formatMaloti(metrics.nextInstallment.remainingAmount || metrics.nextInstallment.expectedAmount)} on ${metrics.nextInstallment.dueDate}`
                  : 'All installments fulfilled'}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-200 text-[10px] font-bold">
            {metrics.completedInstallments === metrics.totalInstallments ? 'All Paid' : `Part ${metrics.completedInstallments + 1}`}
          </span>
        </div>
      )}

      {/* 6. Interactive Payoff Simulator Slider Toggle */}
      {!isFullySettled && (
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setShowPayoffSimulator(!showPayoffSimulator)}
              className="text-[11px] font-bold text-blue-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-3 h-3 text-blue-400" />
              <span>{showPayoffSimulator ? 'Hide Payoff Simulator' : 'Simulate Extra Payment'}</span>
            </button>

            {showPayoffSimulator && simulationPayAmount > 0 && (
              <button
                type="button"
                onClick={() => setSimulationPayAmount(0)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {showPayoffSimulator && (
            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 space-y-2 animate-in fade-in">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium">Test Payment Amount:</span>
                <span className="font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                  +{formatMaloti(simulationPayAmount)}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={metrics.currentBalance}
                step={25}
                value={simulationPayAmount}
                onChange={(e) => setSimulationPayAmount(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />

              <div className="flex justify-between text-[10px] text-slate-300">
                <span>Resulting Progress: <strong>{metrics.simProgressPercent}%</strong></span>
                <span>New Balance: <strong>{formatMaloti(metrics.simRemainingBalance)}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Action Button Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
        {!isFullySettled ? (
          <>
            {onPayNow && (
              <button
                onClick={() => {
                  const payAmt = simulationPayAmount > 0 ? simulationPayAmount : metrics.currentBalance;
                  onPayNow(currentLoan, payAmt);
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>
                  {simulationPayAmount > 0 
                    ? `Pay ${formatMaloti(simulationPayAmount)}` 
                    : `Repay ${formatMaloti(metrics.currentBalance)}`}
                </span>
              </button>
            )}

            {onViewStatement && (
              <button
                onClick={() => onViewStatement(currentLoan)}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Receipts ({metrics.confirmedPaymentsCount})</span>
              </button>
            )}
          </>
        ) : (
          <>
            {onApplyNew && (
              <button
                onClick={onApplyNew}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Apply Next Loan</span>
              </button>
            )}

            {onViewStatement && (
              <button
                onClick={() => onViewStatement(currentLoan)}
                className="py-2.5 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Settlement Certificate</span>
              </button>
            )}
          </>
        )}
      </div>

    </div>
  );
};
