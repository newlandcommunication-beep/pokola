import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Percent, 
  Calendar, 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Building2, 
  ArrowRight, 
  Sparkles,
  PhoneCall,
  DollarSign,
  AlertCircle,
  FileText,
  CreditCard,
  WifiOff
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { formatPercent } from '../utils/loanEngine';

export interface FAQItem {
  id: string;
  category: 'criteria' | 'interest' | 'deadlines' | 'repayment' | 'nmds';
  question: string;
  answer: string;
  highlights?: string[];
  tags: string[];
}

interface MobileFAQsProps {
  settings: BusinessSettings;
  onNavigateTab?: (tab: 'home' | 'calc' | 'apply' | 'repay' | 'ai' | 'account' | 'faqs') => void;
  onOpenSupportTicket?: () => void;
  isDarkMode?: boolean;
}

export const MobileFAQs: React.FC<MobileFAQsProps> = ({
  settings,
  onNavigateTab,
  onOpenSupportTicket,
  isDarkMode = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'criteria' | 'interest' | 'deadlines' | 'repayment' | 'nmds'>('all');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('criteria-1');

  const faqData: FAQItem[] = useMemo(() => [
    // 1. Criteria & Eligibility
    {
      id: 'criteria-1',
      category: 'criteria',
      question: 'Who is eligible to apply for a student loan in Lesotho?',
      answer: 'Any enrolled student in recognized tertiary institutions across Lesotho is eligible to apply. This includes National University of Lesotho (NUL), Limkokwing University of Creative Technology (LUCT), Botho University, Lerotholi Polytechnic (Fokothi), Centre for Accounting Studies (CAS), LP, Scott College of Nursing, and Maluti Adventist College. You must be at least 18 years of age with a valid Lesotho National ID or passport.',
      highlights: [
        'Enrolled at accredited Lesotho tertiary institutions',
        'Valid Student ID & Lesotho National Identity Document',
        'Active mobile phone with Vodacom M-Pesa or Econet EcoCash account',
        'No active un-serviced default with POKOLA'
      ],
      tags: ['eligibility', 'requirements', 'institutions', 'nul', 'limkokwing', 'botho', 'qualify']
    },
    {
      id: 'criteria-2',
      category: 'criteria',
      question: 'What documents or verification details do I need to submit?',
      answer: 'POKOLA operates a streamlined digital verification system. You will need your active Student ID Number, institutional email or student registration confirmation, your Lesotho mobile number (registered for M-Pesa or EcoCash), and the contact details of a parent, guardian, or faculty guarantor for emergency confirmation.',
      highlights: [
        'Student ID Number and current year of study',
        'Active Lesotho cellular number',
        'Emergency or guarantor contact information',
        'Digital signature confirmation in-app'
      ],
      tags: ['documents', 'verification', 'id', 'guarantor', 'registration']
    },
    {
      id: 'criteria-3',
      category: 'criteria',
      question: 'Can first-year students or non-NMDS sponsored students apply?',
      answer: 'Yes! POKOLA assists both government-sponsored (NMDS) students needing bridge funding between stipend disbursements and self-sponsored students needing assistance with textbooks, stationery, laboratory equipment, or off-campus accommodation rent.',
      highlights: [
        'Open to Year 1, Year 2, Year 3, and Final Year students',
        'Available to both NMDS recipients and self-funded students'
      ],
      tags: ['first year', 'nmds', 'self sponsored', 'stipend', 'allowance']
    },

    // 2. Interest Rates & Costs
    {
      id: 'interest-1',
      category: 'interest',
      question: `What is the interest rate and how is it calculated?`,
      answer: `POKOLA applies a transparent, fixed monthly interest rate of ${formatPercent(settings.monthlyInterestRate)} (25% per 30-day cycle), fully aligned with Lesotho micro-finance guidelines. For example, borrowing M400 for 30 days incurs an interest of M100, totaling M500 on the due date. There are zero compound penalties or hidden surprises.`,
      highlights: [
        `Fixed ${formatPercent(settings.monthlyInterestRate)} interest per 30-day period`,
        'Simple, transparent formula: Total = Principal + (Principal × 25%)',
        'Example: Borrow M600 → Interest is M150 → Repay M750'
      ],
      tags: ['interest', 'rate', 'cost', 'calculation', 'pricing', 'fees']
    },
    {
      id: 'interest-2',
      category: 'interest',
      question: 'Are there any hidden fees, application charges, or upfront deductions?',
      answer: 'No. POKOLA does not deduct application fees, origination fees, or processing charges from your requested amount. If you are approved for M800, you will receive the full M800 directly into your mobile wallet.',
      highlights: [
        '100% full disbursement to your mobile wallet',
        'Zero upfront application or evaluation fees',
        'Transparent digital contract detailing exact payoff amount'
      ],
      tags: ['fees', 'hidden fees', 'disbursement', 'deductions']
    },
    {
      id: 'interest-3',
      category: 'interest',
      question: 'Can I choose between a 1-month single payment and bi-weekly installments?',
      answer: 'Yes! You can choose a 1-Month Bullet payment (full balance settled on day 30) or a Bi-Weekly Split model (50% on day 15 and the remaining 50% on day 30). You can also simulate and view the visual balance reduction in our built-in Amortization Calculator.',
      highlights: [
        '1-Month Bullet: 1 single payment at 30 days',
        'Bi-Weekly Split: 2 equal installments at day 15 and day 30',
        'Early repayment is welcomed with zero prepayment penalties'
      ],
      tags: ['installments', 'bi-weekly', 'schedule', 'amortization', 'repayment options']
    },

    // 3. Application Deadlines & Speed
    {
      id: 'deadlines-1',
      category: 'deadlines',
      question: 'What are the application deadlines for the academic year?',
      answer: 'POKOLA emergency micro-loans operate with continuous 24/7 rolling admissions throughout both semesters in Lesotho. High-priority expedited review is active during peak academic milestones: Semester 1 intake (August–September), Mid-term assessments (October–November), Semester 2 kickoff (January–February), and Final Examinations (April–May).',
      highlights: [
        'Rolling 24/7 year-round application submission',
        'Semester 1 Priority Intake: August – September',
        'Semester 2 Priority Intake: January – February',
        'Exam Aid Expedited Queue: October/November & April/May'
      ],
      tags: ['deadlines', 'dates', 'intake', 'semester', 'academic calendar', 'exams']
    },
    {
      id: 'deadlines-2',
      category: 'deadlines',
      question: 'How long does loan evaluation and disbursement take?',
      answer: 'Our automated eligibility engine evaluates your profile instantly. Once approved and after you digitally sign the loan agreement on your phone, funds are disbursed directly to your Vodacom M-Pesa or Econet EcoCash account within 15 to 60 minutes.',
      highlights: [
        'Instant automated scoring & verification',
        'Digital signature right on your phone',
        'Disbursement within 15–60 minutes via mobile money'
      ],
      tags: ['speed', 'disbursement time', 'how long', 'fast', 'approval']
    },
    {
      id: 'deadlines-3',
      category: 'deadlines',
      question: 'Can I have multiple active loans at the same time?',
      answer: 'To protect students from over-indebtedness, each student is allowed only one active loan at a time. As soon as your current loan is settled and verified, you immediately become eligible for a new loan with higher credit limits based on your on-time repayment history.',
      highlights: [
        'Maximum 1 active loan per student at a time',
        'Immediate re-application unlocked upon full repayment',
        'Higher credit limits granted for reliable repayment track records'
      ],
      tags: ['multiple loans', 'limit', 'credit limit', 're-apply']
    },

    // 4. Repayment via M-Pesa & EcoCash
    {
      id: 'repayment-1',
      category: 'repayment',
      question: 'How do I make a loan repayment using Vodacom M-Pesa?',
      answer: 'You can repay anytime via your Vodacom Lesotho phone using the official merchant code. Dial *111# -> Select "Pay Merchant" -> Enter Merchant Code 882910 -> Enter Repayment Amount -> Enter Reference (Your Student ID or Loan ID) -> Enter PIN -> Submit the transaction reference in the app.',
      highlights: [
        'Vodacom M-Pesa Merchant Code: 882910',
        'Reference: Your Student ID number or Loan ID',
        'Instant payment capture and receipt generation in app'
      ],
      tags: ['mpesa', 'vodacom', 'merchant code', 'pay', 'how to repay']
    },
    {
      id: 'repayment-2',
      category: 'repayment',
      question: 'How do I make a loan repayment using Econet EcoCash?',
      answer: 'On your Econet Telecom Lesotho SIM, dial *100# -> Select "EcoCash Spaza / Pay Merchant" -> Enter Merchant Code 99401 -> Enter Amount -> Enter Reference (Student ID) -> Enter PIN -> Submit transaction code in the POKOLA Repay tab.',
      highlights: [
        'Econet EcoCash Merchant Code: 99401',
        'Reference: Your Student ID number',
        'Instant SMS confirmation and balance update'
      ],
      tags: ['ecocash', 'econet', 'spaza', 'merchant code', 'repayment']
    },
    {
      id: 'repayment-3',
      category: 'repayment',
      question: 'Can I make partial repayments before the 30-day due date?',
      answer: 'Yes! You can make partial repayments at any time via M-Pesa or EcoCash. Each payment reduces your remaining balance in real time, and you will receive a verifiable receipt for each installment.',
      highlights: [
        'Partial payments accepted anytime',
        'Live balance reduction tracked in your student portal and mobile app',
        'Official printable PDF/digital receipts issued'
      ],
      tags: ['partial payment', 'early repayment', 'installments', 'receipt']
    },

    // 5. NMDS Stipend Delays & Hardship Extensions
    {
      id: 'nmds-1',
      category: 'nmds',
      question: 'What if my NMDS student allowance is delayed by the government?',
      answer: 'We understand that National Manpower Development Secretariat (NMDS) allowance disbursements can occasionally face administrative delays. If your allowance is delayed, you can submit an Extension Request or open a Support Ticket before your due date. Our administration will review your status and grant a grace period without default penalties.',
      highlights: [
        'Formal grace periods for NMDS disbursement delays',
        'Submit an extension request directly in the app',
        'Open a support ticket with your NMDS batch details for assistance'
      ],
      tags: ['nmds', 'delay', 'grace period', 'extension', 'allowance', 'stipend', 'hardship']
    },
    {
      id: 'nmds-2',
      category: 'nmds',
      question: 'Can I view my loan status and repayment details if I am offline without mobile data?',
      answer: 'Yes! POKOLA incorporates Cloud Firestore Offline Persistence. Your active loan balance, repayment schedule, M-Pesa merchant instructions, and previous transaction history are stored securely in your device cache, allowing you to access all critical details even when internet connectivity drops.',
      highlights: [
        'Offline caching for student areas with intermittent mobile network',
        'View loan balance and due date without active mobile data',
        'Syncs automatically once connection is restored'
      ],
      tags: ['offline', 'cache', 'no data', 'intermittent connectivity', 'connectivity']
    }
  ], [settings]);

  // Categories config
  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'criteria', label: 'Eligibility & Criteria', icon: ShieldCheck },
    { id: 'interest', label: 'Interest & Rates', icon: Percent },
    { id: 'deadlines', label: 'Deadlines & Timing', icon: Calendar },
    { id: 'repayment', label: 'M-Pesa & EcoCash', icon: Smartphone },
    { id: 'nmds', label: 'NMDS & Allowances', icon: Building2 },
  ] as const;

  // Filter FAQs based on category and search query
  const filteredFaqs = useMemo(() => {
    return faqData.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inQuestion = faq.question.toLowerCase().includes(q);
      const inAnswer = faq.answer.toLowerCase().includes(q);
      const inTags = faq.tags.some((tag) => tag.toLowerCase().includes(q));

      return inQuestion || inAnswer || inTags;
    });
  }, [faqData, selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 1. Header Hero Card */}
      <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white p-4.5 rounded-3xl shadow-md space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Student Loan FAQs</h2>
              <span className="text-[10px] text-blue-200">Essential guidance for students in Lesotho</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold">
            Lesotho Micro-Credit
          </span>
        </div>

        {/* Quick Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search criteria, 25% interest, deadlines, M-Pesa..."
            className="w-full pl-9.5 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl text-xs text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-400 backdrop-blur-sm font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Key Quick Highlight Badges */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[9px] text-slate-300 block uppercase font-bold">Interest</span>
            <strong className="text-xs text-amber-300 font-black">{formatPercent(settings.monthlyInterestRate)} / Mo</strong>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[9px] text-slate-300 block uppercase font-bold">Intake</span>
            <strong className="text-xs text-emerald-300 font-black">24/7 Rolling</strong>
          </div>
          <div className="bg-white/10 rounded-xl p-2 text-center border border-white/10">
            <span className="text-[9px] text-slate-300 block uppercase font-bold">M-Pesa Pay</span>
            <strong className="text-xs text-blue-200 font-black">Code 882910</strong>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode
                    ? 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FAQ Accordion List */}
      <div className="space-y-2.5">
        {filteredFaqs.length === 0 ? (
          <div className={`rounded-3xl p-6 text-center border space-y-2 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
          }`}>
            <HelpCircle className={`w-8 h-8 mx-auto ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
            <h4 className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>No Matching FAQs Found</h4>
            <p className={`text-[11px] max-w-xs mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              We couldn't find an answer for "{searchQuery}". Try searching for keywords like "criteria", "25%", "deadlines", or "M-Pesa".
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border mt-2 ${
                isDarkMode 
                  ? 'bg-blue-950/80 text-blue-300 border-blue-800' 
                  : 'bg-blue-50 text-blue-900 border-blue-200'
              }`}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden ${
                  isDarkMode
                    ? isExpanded 
                      ? 'bg-slate-900 border-blue-500/60 shadow-xs' 
                      : 'bg-slate-900 border-slate-800 shadow-2xs hover:border-slate-700'
                    : isExpanded 
                      ? 'bg-white border-blue-900/40 shadow-xs' 
                      : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                {/* Question Header */}
                <button
                  type="button"
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="w-full p-4 text-left flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isExpanded 
                        ? 'bg-blue-600 text-white' 
                        : isDarkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-900'
                    }`}>
                      <HelpCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-black leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {faq.question}
                    </span>
                  </div>
                  <div className={`shrink-0 pt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                    {isExpanded ? (
                      <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-900'}`} />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Answer Content */}
                {isExpanded && (
                  <div className={`px-4 pb-4 pt-1 space-y-3 text-xs border-t animate-in fade-in ${
                    isDarkMode 
                      ? 'text-slate-300 border-slate-800' 
                      : 'text-slate-600 border-slate-100'
                  }`}>
                    <p className={`leading-relaxed font-normal ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {faq.answer}
                    </p>

                    {/* Bullet Highlights */}
                    {faq.highlights && faq.highlights.length > 0 && (
                      <div className={`p-3 rounded-2xl border space-y-1.5 ${
                        isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                        <span className={`text-[10px] font-black uppercase tracking-wider block ${
                          isDarkMode ? 'text-slate-200' : 'text-slate-900'
                        }`}>Key Highlights:</span>
                        {faq.highlights.map((point, index) => (
                          <div key={index} className={`flex items-start gap-1.5 text-[11px] ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Category Tag */}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Category: <strong className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>{faq.category}</strong>
                      </span>

                      {faq.category === 'interest' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('calc')}
                          className={`text-[11px] font-bold flex items-center gap-1 hover:underline ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-900'
                          }`}
                        >
                          <span>Open Amortization Calculator</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {faq.category === 'repayment' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('repay')}
                          className={`text-[11px] font-bold flex items-center gap-1 hover:underline ${
                            isDarkMode ? 'text-emerald-400' : 'text-emerald-700'
                          }`}
                        >
                          <span>Go to Repayment Tab</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      {faq.category === 'criteria' && onNavigateTab && (
                        <button
                          type="button"
                          onClick={() => onNavigateTab('apply')}
                          className={`text-[11px] font-bold flex items-center gap-1 hover:underline ${
                            isDarkMode ? 'text-blue-400' : 'text-blue-900'
                          }`}
                        >
                          <span>Start Application</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Still Need Help? Action Banner */}
      <div className={`p-4 rounded-3xl border shadow-2xs space-y-3 transition-colors ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-purple-950/80 text-purple-300 border border-purple-800' : 'bg-purple-50 text-purple-700'
            }`}>
              <Sparkles className={`w-4 h-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h4 className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Need Personalized Guidance?</h4>
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ask POKOLA AI or submit an inquiry to our support staff.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('ai')}
              className={`p-3 rounded-2xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                isDarkMode 
                  ? 'bg-purple-950/60 hover:bg-purple-950 text-purple-200 border-purple-800' 
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
              <span>Ask POKOLA AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onOpenSupportTicket) {
                onOpenSupportTicket();
              } else if (onNavigateTab) {
                onNavigateTab('account');
              }
            }}
            className={`p-3 rounded-2xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              isDarkMode
                ? 'bg-blue-950/60 hover:bg-blue-950 text-blue-200 border-blue-800'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200'
            }`}
          >
            <PhoneCall className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`} />
            <span>Support Ticket</span>
          </button>
        </div>
      </div>

    </div>
  );
};
