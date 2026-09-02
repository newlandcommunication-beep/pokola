import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
  Percent,
  Smartphone,
  Calendar,
  Building2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  RefreshCw,
  Mic,
  MicOff,
  ArrowRight,
  Calculator,
  CreditCard,
  FileCheck2,
  LifeBuoy,
  ChevronRight,
  Info,
  Clock
} from 'lucide-react';
import { UserProfile, Loan, BusinessSettings } from '../types';
import { formatPercent } from '../utils/loanEngine';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  faqCategory?: 'criteria' | 'interest' | 'deadlines' | 'repayment' | 'nmds' | 'account';
  sourceTitle?: string;
  suggestedAction?: {
    label: string;
    tab: 'home' | 'calc' | 'apply' | 'repay' | 'account' | 'faqs';
    iconName?: string;
  };
  feedback?: 'like' | 'dislike';
}

interface MobileAiChatbotProps {
  currentUser: UserProfile | null;
  activeLoan?: Loan | null;
  settings: BusinessSettings;
  isDarkMode?: boolean;
  onNavigateTab: (tab: 'home' | 'calc' | 'apply' | 'repay' | 'activity' | 'ai' | 'account' | 'faqs') => void;
  onOpenSupportTicket?: () => void;
}

// Built-in FAQ knowledge base for instant matching & grounded prompt injection
const FAQ_KNOWLEDGE_BASE = [
  {
    id: 'crit-1',
    category: 'criteria' as const,
    title: 'Eligibility & Institutions',
    triggers: ['who can apply', 'eligible', 'qualify', 'institutions', 'schools', 'universities', 'nul', 'luct', 'limkokwing', 'botho', 'lerotholi', 'fokothi', 'cas'],
    question: 'Who is eligible to apply for a student loan in Lesotho?',
    answer: 'Any actively enrolled tertiary student at accredited Lesotho institutions (including NUL, Botho University, Limkokwing University LUCT, Lerotholi Polytechnic Fokothi, CAS, LP, Scott College of Nursing, and Maluti Adventist College) is eligible. You must be at least 18 years old with a valid Lesotho National ID or passport, Student ID, and an active Vodacom M-Pesa or Econet EcoCash account.',
    action: { label: 'Start Loan Application', tab: 'apply' as const }
  },
  {
    id: 'crit-2',
    category: 'criteria' as const,
    title: 'Required Verification Documents',
    triggers: ['documents', 'requirements', 'verification', 'what do i need', 'id card', 'guarantor'],
    question: 'What documents or verification details do I need?',
    answer: 'POKOLA uses streamlined digital verification. You will need: (1) Active Student ID number and current study year, (2) Lesotho National ID card number, (3) Registered Lesotho cellular number (M-Pesa or EcoCash), and (4) Emergency contact or guarantor information. Approval is completely digital without paper queues.',
    action: { label: 'Check Eligibility', tab: 'apply' as const }
  },
  {
    id: 'crit-3',
    category: 'criteria' as const,
    title: '1st Year & Self-Sponsored Students',
    triggers: ['first year', '1st year', 'self sponsored', 'non-nmds', 'no allowance', 'private student'],
    question: 'Can 1st-year students or non-NMDS self-sponsored students apply?',
    answer: 'Yes! POKOLA is open to Year 1, Year 2, Year 3, and final year students across both NMDS government-sponsored and self-sponsored categories needing assistance for textbooks, meal allowances, equipment, or rent.',
    action: { label: 'Apply Now', tab: 'apply' as const }
  },
  {
    id: 'int-1',
    category: 'interest' as const,
    title: '25% Monthly Simple Interest',
    triggers: ['interest', 'how much interest', 'rate', '25%', 'cost', 'pricing', 'formula', 'calculate'],
    question: 'What is the interest rate and how is it calculated?',
    answer: 'POKOLA charges a fair, fixed **25% simple monthly interest** rate (aligned with Lesotho micro-credit guidelines):\n- **Formula**: `Interest = Principal × 25%`\n- **Example**: Borrow **M400** → Interest is **M100** → Total repayable is **M500**.\n- **Example**: Borrow **M800** → Interest is **M200** → Total repayable is **M1,000**.\nThere are no hidden administrative deductions or compounding fees.',
    action: { label: 'Open Loan Calculator', tab: 'calc' as const }
  },
  {
    id: 'int-2',
    category: 'interest' as const,
    title: 'Repayment Schedule Options',
    triggers: ['schedule', 'installments', 'bi-weekly', 'bullet', 'split payment', 'repayment options'],
    question: 'Can I pay in bi-weekly installments or bullet payment?',
    answer: 'Yes! You can choose either (1) **1-Month Bullet**: 100% full payoff on day 30, or (2) **Bi-Weekly Split**: 50% on day 15 and 50% on day 30. You can also make early partial payments anytime without penalty to lower your balance.',
    action: { label: 'Simulate Schedules', tab: 'calc' as const }
  },
  {
    id: 'repay-1',
    category: 'repayment' as const,
    title: 'Vodacom M-Pesa Repayment Guide',
    triggers: ['mpesa', 'm-pesa', 'vodacom', 'merchant code', 'how to pay mpesa', 'till number'],
    question: 'How do I repay using Vodacom M-Pesa?',
    answer: 'To repay via Vodacom M-Pesa:\n1. Dial `*111#` on your Vodacom Lesotho SIM\n2. Select **Pay Merchant**\n3. Enter Merchant Code: **882910** (POKOLA)\n4. Enter Amount in Maloti\n5. Enter Reference: Your **Student ID** or Loan Number\n6. Enter your M-Pesa PIN\n7. Enter the SMS transaction reference code in the POKOLA app under the **Repay** tab for instant receipting.',
    action: { label: 'Submit M-Pesa Repayment', tab: 'repay' as const }
  },
  {
    id: 'repay-2',
    category: 'repayment' as const,
    title: 'Econet EcoCash Repayment Guide',
    triggers: ['ecocash', 'eco cash', 'econet', 'spaza', 'how to pay ecocash'],
    question: 'How do I repay using Econet EcoCash?',
    answer: 'To repay via Econet EcoCash:\n1. Dial `*100#` on your Econet Telecom Lesotho SIM\n2. Select **EcoCash Spaza / Pay Merchant**\n3. Enter Merchant Code: **99401**\n4. Enter Repayment Amount & Reference (Student ID)\n5. Confirm with your PIN\n6. Log the reference code in the app to download your official payment receipt.',
    action: { label: 'Go to Repay Tab', tab: 'repay' as const }
  },
  {
    id: 'dead-1',
    category: 'deadlines' as const,
    title: 'Application Deadlines & Intake Periods',
    triggers: ['deadline', 'deadlines', 'when to apply', 'semester', 'intake', 'dates', 'exam period'],
    question: 'What are the application deadlines for the academic year?',
    answer: 'POKOLA operates **24/7 continuous rolling admissions** throughout the year. Priority fast-track review is open during Semester 1 Intake (August–September), Mid-terms (October–November), Semester 2 Intake (January–February), and Final Exams (April–May).',
    action: { label: 'Submit Application', tab: 'apply' as const }
  },
  {
    id: 'dead-2',
    category: 'deadlines' as const,
    title: 'Disbursement Speed',
    triggers: ['how long', 'speed', 'fast', 'disbursement', 'when do i get money', 'how fast'],
    question: 'How fast will I receive the loan funds?',
    answer: 'Once you submit your application and digitally sign the agreement on your phone, our automated verification processes the payout directly into your Vodacom M-Pesa or Econet EcoCash wallet within **15 to 60 minutes**.',
    action: { label: 'Start Quick Application', tab: 'apply' as const }
  },
  {
    id: 'nmds-1',
    category: 'nmds' as const,
    title: 'NMDS Allowance Delay & Grace Periods',
    triggers: ['nmds', 'allowance delay', 'stipend late', 'government late', 'grace period', 'extension', 'hardship'],
    question: 'What if my NMDS student allowance is delayed by the government?',
    answer: 'POKOLA provides a **3-day penalty-free grace period** past every due date. Furthermore, if NMDS student allowance batches are delayed across campus, you can submit an **Extension Request** or open a **Support Ticket** before your due date. Our loan officers will extend your term without default penalties.',
    action: { label: 'Request NMDS Extension / Ticket', tab: 'account' as const }
  },
  {
    id: 'nmds-2',
    category: 'nmds' as const,
    title: 'Offline App Access',
    triggers: ['offline', 'no internet', 'no data', 'cache', 'without data'],
    question: 'Can I check my loan details offline without data?',
    answer: 'Yes! POKOLA is built with Cloud Firestore offline persistence. Your balance, due date, payment instructions, and receipts remain accessible on your device even with zero mobile data.',
    action: { label: 'View Current Loan Status', tab: 'home' as const }
  }
];

export const MobileAiChatbot: React.FC<MobileAiChatbotProps> = ({
  currentUser,
  activeLoan,
  settings,
  isDarkMode = false,
  onNavigateTab,
  onOpenSupportTicket
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Hello ${currentUser?.fullName ? currentUser.fullName.split(' ')[0] : 'there'}! I am **POKOLA AI**, your 24/7 student loan companion in Lesotho.\n\nI am grounded in all official POKOLA policies, FAQ criteria, 25% simple interest rules, and M-Pesa / EcoCash payment procedures. How can I help you today?`,
      time: 'Just now',
      faqCategory: 'criteria',
      sourceTitle: 'POKOLA Knowledge Base'
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'criteria' | 'interest' | 'repayment' | 'deadlines' | 'nmds'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const windowObj = window as any;
    const SpeechRecognition = windowObj.SpeechRecognition || windowObj.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendMessage(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechRecognitionRef.current) {
      alert('Speech recognition is not supported on this browser.');
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        speechRecognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition start error:', err);
      }
    }
  };

  // Find local FAQ match for fast grounding
  const findLocalFaqMatch = (query: string) => {
    const q = query.toLowerCase();
    for (const faq of FAQ_KNOWLEDGE_BASE) {
      if (faq.triggers.some((trigger) => q.includes(trigger.toLowerCase()))) {
        return faq;
      }
    }
    return null;
  };

  const handleSendMessage = async (customText?: string) => {
    const query = (customText || inputQuery).trim();
    if (!query || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    // Contextual matching from knowledge base
    const localFaqMatch = findLocalFaqMatch(query);

    try {
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          studentContext: {
            studentName: currentUser?.fullName || 'Student',
            studentIdNumber: currentUser?.studentIdNumber || 'N/A',
            institution: currentUser?.institution || 'Lesotho Institution',
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
            matchedFaqTitle: localFaqMatch ? localFaqMatch.title : undefined,
          },
        }),
      });

      const data = await resp.json();
      const replyText = data.reply || (localFaqMatch ? localFaqMatch.answer : 'I have analyzed your request based on POKOLA Lesotho guidelines.');

      // Determine suggested action
      let suggestedAction = localFaqMatch?.action;
      if (!suggestedAction) {
        const lower = query.toLowerCase();
        if (lower.includes('calc') || lower.includes('interest') || lower.includes('formula')) {
          suggestedAction = { label: 'Open Loan Calculator', tab: 'calc' };
        } else if (lower.includes('repay') || lower.includes('mpesa') || lower.includes('ecocash') || lower.includes('pay')) {
          suggestedAction = { label: 'Go to Repayment Tab', tab: 'repay' };
        } else if (lower.includes('apply') || lower.includes('borrow') || lower.includes('limit')) {
          suggestedAction = { label: 'Start Application', tab: 'apply' };
        } else if (lower.includes('nmds') || lower.includes('support') || lower.includes('help') || lower.includes('ticket')) {
          suggestedAction = { label: 'Submit Support Ticket', tab: 'account' };
        }
      }

      const aiMessageId = `ai-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          sender: 'ai',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          faqCategory: localFaqMatch ? localFaqMatch.category : undefined,
          sourceTitle: localFaqMatch ? `POKOLA FAQ: ${localFaqMatch.title}` : 'Verified POKOLA Lesotho Guidelines',
          suggestedAction,
        }
      ]);
    } catch {
      // Offline / network fallback with local grounded FAQ
      const fallbackText = localFaqMatch
        ? localFaqMatch.answer
        : `To settle your loan in Lesotho, dial *111# for Vodacom M-Pesa Merchant 882910 or *100# for EcoCash Merchant 99401 with your Student ID. For general inquiries, check our FAQ directory or submit a ticket.`;

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallbackText,
          time: 'Just now',
          faqCategory: localFaqMatch ? localFaqMatch.category : 'repayment',
          sourceTitle: localFaqMatch ? `Offline FAQ: ${localFaqMatch.title}` : 'POKOLA Offline Policy',
          suggestedAction: localFaqMatch?.action || { label: 'View Repayments', tab: 'repay' },
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, feedback: type } : msg))
    );
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `Chat cleared! Ask me any question regarding POKOLA loan limits, 25% simple interest, M-Pesa payments, or application criteria.`,
        time: 'Just now',
        sourceTitle: 'POKOLA Knowledge Base'
      }
    ]);
  };

  // Filter FAQ quick suggestions based on active category
  const filteredQuickFaqs = FAQ_KNOWLEDGE_BASE.filter(
    (item) => activeCategory === 'all' || item.category === activeCategory
  );

  return (
    <div className={`flex flex-col h-[560px] rounded-3xl border shadow-sm overflow-hidden transition-all duration-200 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      
      {/* 1. Header Bar with Grounding Status & Controls */}
      <div className="p-3.5 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shadow-xs border-b border-blue-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight">POKOLA AI Assistant</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
            </div>
            <span className="text-[10px] text-blue-200 font-medium">Grounded in Lesotho FAQ Knowledge</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            title="Clear Chat History"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Category Quick Filters */}
      <div className={`px-3 py-2 border-b flex items-center gap-1.5 overflow-x-auto scrollbar-none ${
        isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {[
          { id: 'all', label: 'All Topics', icon: HelpCircle },
          { id: 'criteria', label: 'Eligibility', icon: ShieldCheck },
          { id: 'interest', label: '25% Interest', icon: Percent },
          { id: 'repayment', label: 'M-Pesa & EcoCash', icon: Smartphone },
          { id: 'deadlines', label: 'Deadlines', icon: Calendar },
          { id: 'nmds', label: 'NMDS Delays', icon: Building2 },
        ].map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Fast FAQ Suggestion Chips Bar */}
      <div className={`px-3 py-1.5 border-b flex gap-1.5 overflow-x-auto scrollbar-none ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        {filteredQuickFaqs.slice(0, 5).map((faq) => (
          <button
            key={faq.id}
            type="button"
            onClick={() => handleSendMessage(faq.question)}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap text-left border transition-colors flex items-center gap-1 ${
              isDarkMode 
                ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-blue-50/60 hover:bg-blue-100/70 text-blue-950 border-blue-100'
            }`}
          >
            <ChevronRight className="w-2.5 h-2.5 text-blue-500 shrink-0" />
            <span className="truncate max-w-[210px]">{faq.question}</span>
          </button>
        ))}
      </div>

      {/* 4. Chat Messages Scroll Area */}
      <div className={`flex-1 p-3.5 overflow-y-auto space-y-3 text-xs ${
        isDarkMode ? 'bg-slate-900/60' : 'bg-slate-50/50'
      }`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
          >
            <div
              className={`max-w-[88%] p-3.5 rounded-2xl transition-all ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                  : isDarkMode
                    ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700 shadow-2xs'
                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/90 shadow-2xs'
              }`}
            >
              {/* Message Content with Markdown Line Breaks */}
              <div className="leading-relaxed whitespace-pre-wrap font-normal">
                {msg.text.split('\n').map((line, idx) => {
                  if (line.startsWith('- ')) {
                    return (
                      <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
                        <span className="text-blue-400 font-bold">•</span>
                        <span>{line.replace('- ', '')}</span>
                      </div>
                    );
                  }
                  return <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>{line}</p>;
                })}
              </div>

              {/* Source Knowledge Tag on AI response */}
              {msg.sender === 'ai' && msg.sourceTitle && (
                <div className="mt-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                  <span className={`flex items-center gap-1 font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>{msg.sourceTitle}</span>
                  </span>

                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      title="Copy message"
                      className="p-1 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 'like')}
                      className={`p-1 hover:text-emerald-500 ${msg.feedback === 'like' ? 'text-emerald-500' : ''}`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeedback(msg.id, 'dislike')}
                      className={`p-1 hover:text-rose-500 ${msg.feedback === 'dislike' ? 'text-rose-500' : ''}`}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Embedded Direct Action Button */}
              {msg.sender === 'ai' && msg.suggestedAction && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (msg.suggestedAction?.tab === 'account' && onOpenSupportTicket) {
                        onOpenSupportTicket();
                      } else if (msg.suggestedAction?.tab) {
                        onNavigateTab(msg.suggestedAction.tab);
                      }
                    }}
                    className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
                      isDarkMode
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <span>{msg.suggestedAction.label}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <span className={`text-[9px] px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {msg.time}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className={`p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2 border animate-pulse ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>POKOLA AI is cross-referencing Lesotho FAQ rules...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 5. Speech Recognition Listening Alert */}
      {isListening && (
        <div className="px-3 py-1 bg-amber-500/10 border-t border-amber-500/20 text-amber-500 text-[11px] font-bold flex items-center justify-between">
          <span className="flex items-center gap-1.5 animate-pulse">
            <Mic className="w-3.5 h-3.5" />
            <span>Listening... Speak your student loan question</span>
          </span>
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            className="text-[10px] underline"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 6. Query Input Form Bar */}
      <div className={`p-2.5 border-t flex items-center gap-1.5 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          title={isListening ? 'Stop Voice Input' : 'Speak Question'}
          className={`p-2.5 rounded-xl border transition-colors ${
            isListening 
              ? 'bg-rose-500 text-white border-rose-600 animate-pulse' 
              : isDarkMode 
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask criteria, 25% interest, M-Pesa 882910..."
          className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 border ${
            isDarkMode 
              ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' 
              : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />

        <button
          type="button"
          onClick={() => handleSendMessage()}
          disabled={!inputQuery.trim() || isLoading}
          className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
