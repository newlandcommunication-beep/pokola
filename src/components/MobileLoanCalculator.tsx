import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingDown, 
  TrendingUp, 
  Info, 
  Sliders, 
  ShieldCheck,
  Zap,
  Sparkles,
  Award,
  HelpCircle,
  BarChart3,
  Layers,
  Check
} from 'lucide-react';
import { 
  calculateLoan, 
  calculateInterest, 
  calculateTotalRepayment, 
  formatMaloti, 
  formatPercent, 
  roundMoney,
  toCents,
  fromCents
} from '../utils/loanEngine';
import { BusinessSettings } from '../types';

export interface AmortizationPoint {
  period: number;
  label: string;
  dayOffset: number;
  dateStr: string;
  paymentAmount: number;
  principalPortion: number;
  interestPortion: number;
  cumulativePaid: number;
  remainingBalance: number;
  percentageReduced: number;
}

interface MobileLoanCalculatorProps {
  settings: BusinessSettings;
  onApplyWithConfig?: (amount: number, repaymentModel: 'one_month' | 'bi_weekly') => void;
  isDarkMode?: boolean;
}

export const MobileLoanCalculator: React.FC<MobileLoanCalculatorProps> = ({
  settings,
  onApplyWithConfig,
  isDarkMode = false,
}) => {
  // Principal & Structure Controls
  const [calcAmount, setCalcAmount] = useState<number>(600);
  const [repaymentModel, setRepaymentModel] = useState<'one_month' | 'bi_weekly' | 'two_months' | 'three_months'>('bi_weekly');
  const [customDays, setCustomDays] = useState<number>(30);
  const [customMonthlyAllowance, setCustomMonthlyAllowance] = useState<number>(1500); // NMDS student stipend
  
  // Interactive View Modes
  const [activeViewMode, setActiveViewMode] = useState<'chart' | 'table'>('chart');
  const [selectedAmortPoint, setSelectedAmortPoint] = useState<number | null>(null);
  const [enableEarlyPaymentSim, setEnableEarlyPaymentSim] = useState<boolean>(false);
  const [earlyPayoffDays, setEarlyPayoffDays] = useState<number>(14);

  // Quick preset chips for Lesotho students
  const presetAmounts = [200, 400, 600, 800, 1000, 1500];

  // Derive term length based on selected repayment model
  const effectiveTermDays = useMemo(() => {
    switch (repaymentModel) {
      case 'one_month':
        return 30;
      case 'bi_weekly':
        return 30;
      case 'two_months':
        return 60;
      case 'three_months':
        return 90;
      default:
        return customDays;
    }
  }, [repaymentModel, customDays]);

  // Core Engine calculation
  const calculation = useMemo(() => {
    const modelForEngine = repaymentModel === 'bi_weekly' ? 'bi_weekly' : 'one_month';
    return calculateLoan(
      calcAmount,
      settings.monthlyInterestRate,
      effectiveTermDays,
      modelForEngine
    );
  }, [calcAmount, settings.monthlyInterestRate, effectiveTermDays, repaymentModel]);

  // Generate detailed visual amortization schedule data points
  const amortizationSchedule = useMemo<AmortizationPoint[]>(() => {
    const points: AmortizationPoint[] = [];
    const startDate = new Date();
    const totalRepayable = calculation.totalRepayment;
    const totalPrincipal = calculation.principal;
    const totalInterest = calculation.interestAmount;

    let installmentCount = 1;
    let intervalDays = 30;

    if (repaymentModel === 'bi_weekly') {
      installmentCount = 2;
      intervalDays = 15;
    } else if (repaymentModel === 'two_months') {
      installmentCount = 2;
      intervalDays = 30;
    } else if (repaymentModel === 'three_months') {
      installmentCount = 3;
      intervalDays = 30;
    }

    // Point 0: Loan Disbursement (Day 0)
    points.push({
      period: 0,
      label: 'Disbursement',
      dayOffset: 0,
      dateStr: startDate.toISOString().split('T')[0],
      paymentAmount: 0,
      principalPortion: 0,
      interestPortion: 0,
      cumulativePaid: 0,
      remainingBalance: totalRepayable,
      percentageReduced: 0,
    });

    const totalCents = toCents(totalRepayable);
    const principalCents = toCents(totalPrincipal);
    const interestCents = toCents(totalInterest);

    const basePaymentCents = Math.floor(totalCents / installmentCount);
    const basePrincipalCents = Math.floor(principalCents / installmentCount);
    const baseInterestCents = Math.floor(interestCents / installmentCount);

    let runningPaidCents = 0;
    let runningPrincipalPaidCents = 0;
    let runningInterestPaidCents = 0;

    for (let i = 1; i <= installmentCount; i++) {
      const isLast = i === installmentCount;
      const paymentCents = isLast ? (totalCents - runningPaidCents) : basePaymentCents;
      const pCents = isLast ? (principalCents - runningPrincipalPaidCents) : basePrincipalCents;
      const iCents = isLast ? (interestCents - runningInterestPaidCents) : baseInterestCents;

      runningPaidCents += paymentCents;
      runningPrincipalPaidCents += pCents;
      runningInterestPaidCents += iCents;

      const remainingCents = Math.max(0, totalCents - runningPaidCents);
      const remainingMaloti = fromCents(remainingCents);
      const dayOffset = i * intervalDays;
      const targetDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

      const percentReduced = Math.round((runningPaidCents / totalCents) * 100);

      points.push({
        period: i,
        label: `Installment #${i}`,
        dayOffset,
        dateStr: targetDate.toISOString().split('T')[0],
        paymentAmount: fromCents(paymentCents),
        principalPortion: fromCents(pCents),
        interestPortion: fromCents(iCents),
        cumulativePaid: fromCents(runningPaidCents),
        remainingBalance: remainingMaloti,
        percentageReduced: percentReduced,
      });
    }

    return points;
  }, [calculation, repaymentModel]);

  // Allowance Debt-to-Income / Burden calculation
  const monthlyRepaymentBurdenPercent = customMonthlyAllowance > 0
    ? Math.min(100, Math.round((calculation.totalRepayment / customMonthlyAllowance) * 100))
    : 0;

  const isBurdenSafe = monthlyRepaymentBurdenPercent <= 40;

  // Visual percentages for Principal vs Interest bar
  const principalPercent = calculation.totalRepayment > 0
    ? Math.round((calculation.principal / calculation.totalRepayment) * 100)
    : 80;
  const interestPercent = 100 - principalPercent;

  // Max balance for SVG graph scaling
  const maxBalance = calculation.totalRepayment || 1;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header Hero Card with Instant Metrics */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-4.5 rounded-3xl shadow-md space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Amortization Calculator</h2>
              <span className="text-[10px] text-blue-200">Visual balance reduction & installment scheduler</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black tracking-wide">
            {formatPercent(settings.monthlyInterestRate)} / mo
          </span>
        </div>

        {/* Repayment Summary Bar */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-300 block uppercase tracking-wider">Total Repayable Balance</span>
            <div className="text-2xl font-black text-white tracking-tight mt-0.5">
              {formatMaloti(calculation.totalRepayment)}
            </div>
            <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> Full Payoff: {calculation.dueDate}
            </span>
          </div>

          <div className="text-right space-y-1">
            <span className="text-[10px] font-semibold text-slate-300 block">Interest Incurred</span>
            <div className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20 inline-block">
              + {formatMaloti(calculation.interestAmount)}
            </div>
          </div>
        </div>

        {/* Principal vs Interest Composition Segment Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-300">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span> Principal: {formatMaloti(calculation.principal)} ({principalPercent}%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Interest: {formatMaloti(calculation.interestAmount)} ({interestPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex p-0.5 border border-white/10">
            <div 
              className="bg-blue-400 h-full rounded-l-full transition-all duration-300"
              style={{ width: `${principalPercent}%` }}
              title={`Principal: ${formatMaloti(calculation.principal)}`}
            />
            <div 
              className="bg-amber-400 h-full rounded-r-full transition-all duration-300"
              style={{ width: `${interestPercent}%` }}
              title={`Interest: ${formatMaloti(calculation.interestAmount)}`}
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive Input Controls */}
      <div className={`p-4 rounded-3xl border shadow-2xs space-y-4 transition-colors ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Principal Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className={`text-xs font-bold flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <DollarSign className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />
              <span>Borrowing Principal (Maloti)</span>
            </label>
            <span className={`text-lg font-black px-3 py-0.5 rounded-xl border ${
              isDarkMode 
                ? 'text-blue-300 bg-blue-950/60 border-blue-800' 
                : 'text-blue-900 bg-blue-50 border-blue-100'
            }`}>
              {formatMaloti(calcAmount)}
            </span>
          </div>

          <input
            id="mobile-amort-slider"
            type="range"
            min={settings.minLoanAmount}
            max={settings.maxLoanAmount}
            step={50}
            value={calcAmount}
            onChange={(e) => setCalcAmount(Number(e.target.value))}
            className={`w-full accent-blue-600 cursor-pointer h-2 rounded-lg appearance-none ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-100'
            }`}
          />

          {/* Quick Preset Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setCalcAmount(amt)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  calcAmount === amt
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                M{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Repayment Structure Selector */}
        <div className={`space-y-2 border-t pt-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <label className={`text-xs font-bold flex items-center gap-1.5 ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <Calendar className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />
            <span>Repayment Model & Installment Cadence</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRepaymentModel('bi_weekly')}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                repaymentModel === 'bi_weekly'
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-950/70 text-blue-200 shadow-2xs'
                    : 'border-blue-900 bg-blue-50/80 text-blue-950 shadow-2xs'
                  : isDarkMode
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">Bi-Weekly (2 Parts)</span>
                {repaymentModel === 'bi_weekly' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />}
              </div>
              <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Day 15 & Day 30</span>
              <strong className={`text-xs block mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                2 × {formatMaloti(roundMoney(calculation.totalRepayment / 2))}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setRepaymentModel('one_month')}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                repaymentModel === 'one_month'
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-950/70 text-blue-200 shadow-2xs'
                    : 'border-blue-900 bg-blue-50/80 text-blue-950 shadow-2xs'
                  : isDarkMode
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">1-Month Bullet</span>
                {repaymentModel === 'one_month' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />}
              </div>
              <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Single payment at Day 30</span>
              <strong className={`text-xs block mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                1 × {formatMaloti(calculation.totalRepayment)}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setRepaymentModel('two_months')}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                repaymentModel === 'two_months'
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-950/70 text-blue-200 shadow-2xs'
                    : 'border-blue-900 bg-blue-50/80 text-blue-950 shadow-2xs'
                  : isDarkMode
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">60-Day (2 Months)</span>
                {repaymentModel === 'two_months' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />}
              </div>
              <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monthly installments</span>
              <strong className={`text-xs block mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                2 × {formatMaloti(roundMoney(calculation.totalRepayment / 2))}
              </strong>
            </button>

            <button
              type="button"
              onClick={() => setRepaymentModel('three_months')}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                repaymentModel === 'three_months'
                  ? isDarkMode
                    ? 'border-blue-500 bg-blue-950/70 text-blue-200 shadow-2xs'
                    : 'border-blue-900 bg-blue-50/80 text-blue-950 shadow-2xs'
                  : isDarkMode
                    ? 'border-slate-800 text-slate-400 hover:bg-slate-800/60'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">90-Day (Semester)</span>
                {repaymentModel === 'three_months' && <CheckCircle2 className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />}
              </div>
              <span className={`text-[11px] block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>3 equal monthly payments</span>
              <strong className={`text-xs block mt-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                3 × {formatMaloti(roundMoney(calculation.totalRepayment / 3))}
              </strong>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Visual Amortization Schedule Card */}
      <div className={`p-4 rounded-3xl border shadow-2xs space-y-3.5 transition-colors ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <h3 className={`text-xs font-black uppercase tracking-wider ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Amortization & Balance Reduction
            </h3>
          </div>

          {/* Toggle between Graph & Table view */}
          <div className={`flex items-center p-0.5 rounded-xl border text-[11px] font-bold ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setActiveViewMode('chart')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeViewMode === 'chart'
                  ? isDarkMode
                    ? 'bg-slate-700 text-blue-300 shadow-2xs font-black'
                    : 'bg-white text-blue-900 shadow-2xs font-black'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-3 h-3" />
              <span>Chart</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('table')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeViewMode === 'table'
                  ? isDarkMode
                    ? 'bg-slate-700 text-blue-300 shadow-2xs font-black'
                    : 'bg-white text-blue-900 shadow-2xs font-black'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Interactive SVG Balance Reduction Graph */}
        {activeViewMode === 'chart' && (
          <div className="space-y-3">
            
            {/* SVG Visual Balance Curve */}
            <div className={`rounded-2xl p-3 border ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex justify-between items-center text-[10px] mb-2">
                <span className={`font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Outstanding Balance Progression
                </span>
                <span className="text-emerald-500 font-bold">Target: M0.00 (Debt-Free)</span>
              </div>

              <div className="relative h-44 w-full">
                <svg viewBox="0 0 320 140" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="300" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="20" y1="65" x2="300" y2="65" stroke="#e2e8f0" strokeDasharray="3 3" />
                  <line x1="20" y1="110" x2="300" y2="110" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Y-Axis Label Indicators */}
                  <text x="5" y="24" fontSize="8" fill="#94a3b8" fontWeight="bold">
                    {formatMaloti(maxBalance)}
                  </text>
                  <text x="5" y="69" fontSize="8" fill="#94a3b8" fontWeight="bold">
                    {formatMaloti(maxBalance / 2)}
                  </text>
                  <text x="8" y="114" fontSize="8" fill="#10b981" fontWeight="bold">
                    M0
                  </text>

                  {/* Build Coordinate Path */}
                  {(() => {
                    const count = amortizationSchedule.length;
                    const coords = amortizationSchedule.map((pt, idx) => {
                      const x = 30 + (idx / (count - 1)) * 260;
                      // Invert Y: top is 20 (max), bottom is 110 (zero balance)
                      const ratio = pt.remainingBalance / maxBalance;
                      const y = 110 - ratio * 90;
                      return { x, y, pt, idx };
                    });

                    // Construct SVG line & area path
                    const pathD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
                    const areaD = `${pathD} L ${coords[coords.length - 1].x} 110 L ${coords[0].x} 110 Z`;

                    return (
                      <>
                        {/* Area Fill */}
                        <path d={areaD} fill="url(#balanceGradient)" />

                        {/* Reduction Line */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="url(#lineGrad)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive Milestone Nodes */}
                        {coords.map((c) => {
                          const isSelected = selectedAmortPoint === c.idx;
                          const isFinal = c.idx === count - 1;

                          return (
                            <g 
                              key={c.idx} 
                              className="cursor-pointer transition-transform"
                              onClick={() => setSelectedAmortPoint(c.idx)}
                            >
                              {/* Pulse outer circle for active or final node */}
                              {(isSelected || isFinal) && (
                                <circle
                                  cx={c.x}
                                  cy={c.y}
                                  r="9"
                                  fill={isFinal ? '#10b981' : '#1e3a8a'}
                                  opacity="0.25"
                                  className="animate-ping"
                                />
                              )}

                              <circle
                                cx={c.x}
                                cy={c.y}
                                r={isSelected ? '6' : '4.5'}
                                fill={isFinal ? '#059669' : '#1e3a8a'}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />

                              {/* Milestone X Labels */}
                              <text
                                x={c.x}
                                y="125"
                                fontSize="8"
                                textAnchor="middle"
                                fill="#64748b"
                                fontWeight="bold"
                              >
                                {c.idx === 0 ? 'Start' : `Day ${c.pt.dayOffset}`}
                              </text>
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Selected / Interactive Node Milestone Details */}
            {(() => {
              const activePoint = selectedAmortPoint !== null
                ? amortizationSchedule[selectedAmortPoint]
                : amortizationSchedule[amortizationSchedule.length - 1];

              return (
                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs animate-in fade-in transition-colors ${
                  isDarkMode 
                    ? 'bg-blue-950/40 border-blue-900/60' 
                    : 'bg-blue-50/70 border-blue-100'
                }`}>
                  <div>
                    <span className={`text-[10px] font-bold uppercase ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-900'
                    }`}>
                      {activePoint.label} ({activePoint.dayOffset === 0 ? 'Start' : `Day ${activePoint.dayOffset}`})
                    </span>
                    <div className={`text-base font-black mt-0.5 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      Remaining: {formatMaloti(activePoint.remainingBalance)}
                    </div>
                    <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Date: {activePoint.dateStr}
                    </span>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                      isDarkMode 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activePoint.percentageReduced}% Paid Off
                    </span>
                    {activePoint.paymentAmount > 0 && (
                      <span className={`text-[10px] block ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        Payment: <strong>{formatMaloti(activePoint.paymentAmount)}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* View Mode 2: Detailed Amortization Table */}
        {activeViewMode === 'table' && (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-bold uppercase ${
                    isDarkMode 
                      ? 'border-slate-800 text-slate-400 bg-slate-950/50' 
                      : 'border-slate-200 text-slate-500 bg-slate-50'
                  }`}>
                    <th className="py-2 px-2 rounded-l-lg">Period</th>
                    <th className="py-2 px-2">Due Date</th>
                    <th className="py-2 px-2">Payment</th>
                    <th className="py-2 px-2">Principal</th>
                    <th className="py-2 px-2">Interest</th>
                    <th className="py-2 px-2 text-right rounded-r-lg">Balance</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {amortizationSchedule.map((row) => (
                    <tr 
                      key={row.period}
                      onClick={() => setSelectedAmortPoint(row.period)}
                      className={`cursor-pointer transition-colors ${
                        isDarkMode
                          ? row.remainingBalance === 0 
                            ? 'bg-emerald-950/40 text-white font-bold' 
                            : 'hover:bg-slate-800/60 text-slate-300'
                          : row.remainingBalance === 0 
                            ? 'bg-emerald-50/40 font-bold' 
                            : 'hover:bg-blue-50/50'
                      }`}
                    >
                      <td className={`py-2 px-2 font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {row.period === 0 ? 'Start' : `#${row.period}`}
                      </td>
                      <td className={`py-2 px-2 text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{row.dateStr}</td>
                      <td className={`py-2 px-2 font-black ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                        {row.paymentAmount > 0 ? formatMaloti(row.paymentAmount) : '-'}
                      </td>
                      <td className={`py-2 px-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {row.principalPortion > 0 ? formatMaloti(row.principalPortion) : '-'}
                      </td>
                      <td className={`py-2 px-2 font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        {row.interestPortion > 0 ? formatMaloti(row.interestPortion) : '-'}
                      </td>
                      <td className={`py-2 px-2 text-right font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {formatMaloti(row.remainingBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`p-2.5 rounded-xl text-[10px] flex items-center justify-between border ${
              isDarkMode 
                ? 'bg-slate-950/60 text-slate-400 border-slate-800' 
                : 'bg-slate-50 text-slate-500 border-slate-200'
            }`}>
              <span>* 25% monthly rate computed per Lesotho micro-credit standards</span>
              <span className="font-bold text-emerald-500">Zero hidden fees</span>
            </div>
          </div>
        )}

      </div>

      {/* 4. Student Allowance Affordability Estimator */}
      <div className={`p-3.5 rounded-3xl border space-y-2.5 text-xs transition-colors ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-slate-200' 
          : 'bg-slate-50 border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`font-bold flex items-center gap-1.5 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />
            <span>Student Allowance Affordability Gauge</span>
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isBurdenSafe 
              ? isDarkMode ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-emerald-100 text-emerald-800' 
              : isDarkMode ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {isBurdenSafe ? 'Safe Ratio' : 'High Ratio'}
          </span>
        </div>

        <div className={`flex justify-between items-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>Estimated NMDS / Monthly Stipend:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400 font-bold">M</span>
            <input
              type="number"
              value={customMonthlyAllowance}
              onChange={(e) => setCustomMonthlyAllowance(Number(e.target.value) || 0)}
              className={`w-20 p-1 border rounded-lg text-xs font-bold text-right shadow-2xs ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Ratio bar */}
        <div className="space-y-1">
          <div className={`flex justify-between text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Repayment vs Stipend Ratio:</span>
            <strong>{monthlyRepaymentBurdenPercent}% of stipend</strong>
          </div>
          <div className={`w-full rounded-full h-1.5 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isBurdenSafe ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${monthlyRepaymentBurdenPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 5. One-Tap Action Button */}
      {onApplyWithConfig && (
        <button
          type="button"
          onClick={() => {
            const chosenModel = repaymentModel === 'bi_weekly' ? 'bi_weekly' : 'one_month';
            onApplyWithConfig(calcAmount, chosenModel);
          }}
          className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 active:scale-[0.99] text-white rounded-2xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>Apply with this Amortization Plan ({formatMaloti(calcAmount)})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}

    </div>
  );
};
