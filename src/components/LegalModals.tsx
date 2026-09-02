import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  Landmark, 
  Scale, 
  Phone, 
  Mail, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPercent, formatMaloti } from '../utils/loanEngine';

interface LegalModalsProps {
  initialTab?: string;
  onNavigateHome: () => void;
  onNavigatePortal: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  initialTab = 'responsible',
  onNavigateHome,
  onNavigatePortal,
}) => {
  const { settings, currentUser } = useApp();
  const [tab, setTab] = useState<string>(initialTab);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Kingdom of Lesotho
              </span>
              <span className="text-xs text-slate-400">• Regulatory & Legal Standards</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">
              POKOLA Compliance & Policies
            </h1>
            <p className="text-xs text-slate-500">
              {settings.legalEntityName} • Reg No: {settings.registrationNumber}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
            >
              Public Home
            </button>
            {currentUser && (
              <button
                onClick={onNavigatePortal}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl"
              >
                Go to Portal
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
          <button
            onClick={() => setTab('responsible')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              tab === 'responsible' ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Responsible Lending Charter
          </button>

          <button
            onClick={() => setTab('terms')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              tab === 'terms' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms & Conditions
          </button>

          <button
            onClick={() => setTab('complaints')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              tab === 'complaints' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> Complaints & Disputes
          </button>

          <button
            onClick={() => setTab('calculator')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              tab === 'calculator' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" /> Interest Calculation Rules
          </button>
        </div>

        {/* TAB 1: RESPONSIBLE LENDING CHARTER */}
        {tab === 'responsible' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 leading-relaxed text-xs text-slate-700">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" /> POKOLA Responsible Student Lending Charter
            </h2>

            <p>
              POKOLA is established to foster academic achievement by providing ethical, transparent micro-credit to registered tertiary students in the Kingdom of Lesotho. Our lending philosophy is built on five core pillars:
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm">1. Strict Cap on Loan Sizes</p>
                <p>We restrict individual loan amounts to a maximum cap of <strong>{formatMaloti(settings.maxLoanAmount, false)}</strong> to prevent student over-indebtedness.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm">2. 100% Upfront Transparency</p>
                <p>All simple monthly interest (<strong>{formatPercent(settings.monthlyInterestRate)}</strong>) and total repayment figures are prominently presented before digital contract execution.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm">3. No Compounding Interest</p>
                <p>Interest never compounds exponentially. We only compute linear simple interest based on the initial disbursed principal.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-slate-900 text-sm">4. Humane Hardship Support</p>
                <p>Students facing emergency academic or medical distress can request payment extensions and structured grace periods through our support desk without predatory harassment.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TERMS AND CONDITIONS */}
        {tab === 'terms' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-700" /> Terms and Conditions of Student Credit
            </h2>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Borrower Eligibility</h4>
                <p>Borrowers must be at least 18 years of age, actively enrolled in an accredited higher education institution in Lesotho, possessing a valid Student ID Card and an active Vodafone M-Pesa or Econet EcoCash account registered under their name.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Loan Disbursement & Repayment</h4>
                <p>Disbursements occur digitally upon digital signature. Repayments must be initiated on or before the due date specified on the loan contract. Prepayment is permitted without early termination fees.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Default and Grace Period</h4>
                <p>A grace period of {settings.gracePeriodDays} calendar days is granted after the due date. Overdue amounts past this grace buffer may accrue an administrative late fee of {settings.lateFeePercent}%. Prolonged delinquency may result in reporting to institutional credit registries.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLAINTS */}
        {tab === 'complaints' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-6 h-6 text-purple-700" /> Student Complaints & Dispute Resolution
            </h2>

            <p>
              POKOLA is dedicated to fair treatment. If you experience an issue with payment reconciliation, loan officer communication, or credit reporting, follow this three-step dispute procedure:
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">Step 1: Open an In-App Support Ticket</p>
                <p className="text-slate-600">Submit full details through the Student Portal Support Desk. An officer must respond within 24 business hours.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">Step 2: Escalation to Central Compliance</p>
                <p className="text-slate-600">Direct your appeal to <strong>{settings.contactSupportEmail}</strong> or call <strong>{settings.contactSupportPhone}</strong>.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-slate-900">Step 3: Physical Office Hearing</p>
                <p className="text-slate-600">Visit our office at {settings.physicalAddress}, Maseru, Lesotho between {settings.supportHours}.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CALCULATOR FORMULA DISCLOSURE */}
        {tab === 'calculator' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-6 text-xs text-slate-700 leading-relaxed">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Landmark className="w-6 h-6 text-blue-700" /> Exact Mathematical Formula Disclosure
            </h2>

            <p>
              POKOLA computes all student loans strictly using standard simple interest mathematics:
            </p>

            <div className="p-5 rounded-2xl bg-slate-900 text-white font-mono space-y-2 text-xs">
              <p className="text-emerald-400 font-bold">// Central Financial Formula</p>
              <p>Interest Amount = Principal × Monthly Interest Rate × (Term Days / 30)</p>
              <p>Total Repayable = Principal + Interest Amount</p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-slate-900 text-sm">Worked Example:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Loan Principal: <strong>M800.00</strong></li>
                <li>Monthly Rate: <strong>25% (0.25)</strong></li>
                <li>Term: <strong>30 Days</strong></li>
                <li>Interest: <strong>M800.00 × 0.25 × (30 / 30) = M200.00</strong></li>
                <li>Total Repayment: <strong>M800.00 + M200.00 = M1,000.00</strong></li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
