import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  Smartphone, 
  Clock, 
  Sparkles, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Landmark, 
  Phone, 
  Mail, 
  MapPin, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateLoan, formatMaloti } from '../utils/loanEngine';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onNavigatePortal: () => void;
  onOpenLegal: (tab?: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  onNavigatePortal,
  onOpenLegal,
}) => {
  const { currentUser, settings } = useApp();

  // Public Calculator state
  const [calculatorAmount, setCalculatorAmount] = useState<number>(800);
  const [selectedTermDays, setSelectedTermDays] = useState<number>(30);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const calcResult = calculateLoan(
    calculatorAmount,
    settings.monthlyInterestRate,
    selectedTermDays
  );

  const faqs = [
    {
      q: 'Who is eligible to apply for a student loan on POKOLA?',
      a: 'Registered students enrolled in recognised tertiary institutions across Lesotho (including National University of Lesotho, Limkokwing University, Lerotholi Polytechnic, Botho University, and CAS) with a valid Student ID and active phone number.',
    },
    {
      q: 'How is the interest calculated?',
      a: `POKOLA uses a clear, simple monthly interest rate (currently ${(settings.monthlyInterestRate * 100).toFixed(0)}%). For example, on a loan of M800 for 1 month, the interest is M800 × ${(settings.monthlyInterestRate * 100).toFixed(0)}% = M${(800 * settings.monthlyInterestRate).toFixed(0)}, resulting in a total repayment of M${(800 * (1 + settings.monthlyInterestRate)).toFixed(0)}. We never hide fees or compound interest silently.`,
    },
    {
      q: 'How do I receive the funds once approved?',
      a: 'Upon digital agreement signature, funds are disbursed directly to your verified Lesotho mobile money account (Vodacom M-Pesa or Econet EcoCash) or your Lesotho commercial bank account.',
    },
    {
      q: 'How and when do I make repayments?',
      a: 'You can make partial or full repayments anytime before your due date directly through Vodacom M-Pesa, Econet EcoCash, or Bank EFT. All recorded payments update your dashboard balance immediately.',
    },
    {
      q: 'What happens if I cannot pay on time?',
      a: 'We provide a 3-day grace period. If you face academic or family hardship, contact our student support team before the due date. A late administrative fee of 5% may apply to overdue balances past the grace period.',
    },
    {
      q: 'Is POKOLA legally registered in Lesotho?',
      a: 'Yes. POKOLA operates under Lesotho regulatory guidelines for microcredit and student financial assistance, strictly adhering to responsible lending principles.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-blue-900 to-slate-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/15 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Hero Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Designed specifically for Students in Lesotho
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                Financial Support <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-emerald-300 to-teal-200">
                  for Students.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-blue-100/80 max-w-2xl font-normal leading-relaxed">
                POKOLA helps eligible students access and manage small loans with clear terms, 
                transparent interest, and simple mobile repayment tracking.
              </p>

              {/* Tagline */}
              <div className="pt-1">
                <p className="text-sm font-semibold tracking-wide text-emerald-400 uppercase">
                  "Your Future. Your Opportunity."
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                {currentUser ? (
                  <button
                    onClick={onNavigatePortal}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-102 flex items-center justify-center gap-2"
                  >
                    Open {currentUser.role === 'student' ? 'Student Portal' : 'Admin Portal'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => onOpenAuth('register')}
                      className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-base rounded-2xl shadow-xl shadow-emerald-500/25 transition-all hover:scale-102 flex items-center justify-center gap-2"
                    >
                      Apply Now (Fast Check)
                      <ArrowRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onOpenAuth('login')}
                      className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-base rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
                    >
                      Student Login
                    </button>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-blue-800/60 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <p className="text-2xl font-black text-white">M1,000</p>
                  <p className="text-xs text-blue-200/70">Max Loan Limit</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-300">25%</p>
                  <p className="text-xs text-blue-200/70">Simple Monthly Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-200">M-Pesa</p>
                  <p className="text-xs text-blue-200/70">& EcoCash Ready</p>
                </div>
              </div>
            </div>

            {/* Hero Right: Live Interactive Loan Calculator Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40 text-slate-900 border border-slate-100">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Loan Calculator</h2>
                      <p className="text-xs text-slate-500">Transparent Lesotho pricing</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    No Hidden Fees
                  </span>
                </div>

                <div className="mt-6 space-y-6">
                  {/* Amount Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Requested Amount
                      </label>
                      <span className="text-2xl font-black text-blue-900">
                        {formatMaloti(calculatorAmount, false)}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={settings.minLoanAmount}
                      max={settings.maxLoanAmount}
                      step={50}
                      value={calculatorAmount}
                      onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                      className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                    />

                    <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                      <span>Min {formatMaloti(settings.minLoanAmount, false)}</span>
                      <span>Max {formatMaloti(settings.maxLoanAmount, false)}</span>
                    </div>
                  </div>

                  {/* Repayment Term */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Repayment Period
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTermDays(30)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          selectedTermDays === 30
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        1 Month (30 Days)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTermDays(14)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                          selectedTermDays === 14
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        2 Weeks (14 Days)
                      </button>
                    </div>
                  </div>

                  {/* Calculation Breakdown Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Principal Loan:</span>
                      <span className="font-semibold text-slate-900">{calcResult.formattedPrincipal}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">
                        Monthly Interest Rate ({(settings.monthlyInterestRate * 100).toFixed(0)}%):
                      </span>
                      <span className="font-semibold text-emerald-700">+{calcResult.formattedInterest}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Estimated Due Date:</span>
                      <span className="font-semibold text-slate-900">{calcResult.dueDate}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Repayment</p>
                        <p className="text-[10px] text-slate-400">Principal + Simple Interest</p>
                      </div>
                      <span className="text-2xl font-black text-blue-950">
                        {calcResult.formattedTotal}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    *Example calculation. Actual approval is subject to verified student enrollment.
                  </p>

                  <button
                    onClick={() => {
                      if (currentUser) {
                        onNavigatePortal();
                      } else {
                        onOpenAuth('register');
                      }
                    }}
                    className="w-full py-3.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-700/20 transition-all hover:scale-101 flex items-center justify-center gap-2"
                  >
                    Apply For {calcResult.formattedPrincipal}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HOW POKOLA WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 tracking-tight">
              How POKOLA Works
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              From application to repayment, we keep the student loan experience transparent, digital, and stress-free.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 relative hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center mb-4 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Check Eligibility</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Register with your Lesotho tertiary institution details and student ID to verify eligibility in seconds.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 relative hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center mb-4 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Select Amount</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Request up to {formatMaloti(settings.maxLoanAmount, false)}. Transparently see your 25% interest and total repayment upfront.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 relative hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-black text-xl flex items-center justify-center mb-4 group-hover:bg-blue-700 group-hover:text-white transition-colors">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sign Digital Terms</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Once reviewed by our loan officer, review and sign your clear digital loan agreement right on your phone.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 relative hover:border-blue-300 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                4
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Disburse & Repay</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive funds and make flexible repayments via Vodacom M-Pesa, EcoCash, or Bank Transfer.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRANSPARENT PRICING & RESPONSIBLE LENDING */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" /> Responsible Student Lending
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                No Hidden Charges. <br />
                Complete Financial Clarity.
              </h2>

              <p className="text-slate-300 leading-relaxed text-base">
                We believe students deserve honest financial support. That's why every POKOLA loan 
                features exact interest disclosure before you accept, zero silent compounding, and no surprise charges.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">{(settings.monthlyInterestRate * 100).toFixed(0)}% Simple Monthly Interest:</strong> Calculated strictly as Principal × Rate.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Early Settlement Friendly:</strong> Pay early anytime with no early repayment penalty fees.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-200">
                    <strong className="text-white">Configurable Grace Period:</strong> 3-day grace buffer after your due date before late fees accrue.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => onOpenLegal('responsible')}
                  className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5"
                >
                  Read our Responsible Lending Charter <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Comparison Box */}
            <div className="lg:col-span-6">
              <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-blue-400" />
                  POKOLA Standard vs. Informal Lenders
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-blue-300 uppercase">POKOLA Platform</span>
                      <span className="text-xs font-bold text-emerald-400">Ethical & Transparent</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Fixed 25% simple interest, digital receipt, automated reminders, institutional verification, and friendly student AI advisor.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-rose-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-300 uppercase">Informal "Machonisa" Money Lenders</span>
                      <span className="text-xs font-bold text-rose-400">High Risk & Predatory</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      50%+ monthly compounding, hidden penalty fees, aggressive debt collection, and withholding of national identity books.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. INSTITUTIONS IN LESOTHO */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            Serving students across all major higher education institutions in Lesotho
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-base font-black text-blue-900">NUL</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">National University of Lesotho</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-base font-black text-blue-900">LUCT</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Limkokwing University Maseru</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-base font-black text-blue-900">FOKOTHI</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Lerotholi Polytechnic</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center">
              <p className="text-base font-black text-blue-900">BOTHO</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Botho University Maseru</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center col-span-2 md:col-span-1">
              <p className="text-base font-black text-blue-900">CAS</p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">Centre for Accounting Studies</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
              Common Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-700 transition-colors"
                >
                  <span className="text-base">{faq.q}</span>
                  {openFaqIndex === idx ? (
                    <ChevronUp className="w-5 h-5 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. COMPLIANCE & FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-700 text-white font-black text-base flex items-center justify-center">
                  P
                </div>
                <span className="text-base font-black text-white tracking-tight">POKOLA</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.legalEntityName} <br />
                Registration No: {settings.registrationNumber}
              </p>
              <p className="text-[11px] text-slate-500">
                {settings.physicalAddress}
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Quick Links</p>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => onOpenAuth('register')} className="hover:text-white transition-colors">
                    Student Loan Application
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors">
                    Borrower Sign In
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenLegal('terms')} className="hover:text-white transition-colors">
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenLegal('privacy')} className="hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Lending Standards</p>
              <ul className="space-y-1.5">
                <li>
                  <button onClick={() => onOpenLegal('responsible')} className="hover:text-white transition-colors">
                    Responsible Lending Charter
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenLegal('complaints')} className="hover:text-white transition-colors">
                    Complaints & Dispute Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => onOpenLegal('calculator')} className="hover:text-white transition-colors">
                    Loan Calculation Rules
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-white text-xs uppercase tracking-wider">Contact & Support</p>
              <div className="space-y-1.5 text-xs">
                <p className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  {settings.contactSupportPhone}
                </p>
                <p className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {settings.contactSupportEmail}
                </p>
                <p className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {settings.supportHours}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/80 space-y-4">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300">Regulatory Disclosure:</strong> {settings.regulatoryNotice} POKOLA does not guarantee automatic loan approval. All lending is subject to student enrollment verification and credit assessment.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
              <p>© {new Date().getFullYear()} POKOLA (Pty) Ltd. Kingdom of Lesotho. All rights reserved.</p>
              <p>Currency: Lesotho Maloti (LSL / M)</p>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
