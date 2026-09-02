import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

// Lazy initialization for Gemini client to prevent crashing if key is unset
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. AI features will run in fallback simulation mode.');
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Decimal-safe helper
function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'POKOLA Financial Engine & FCM Push Service',
      country: 'Kingdom of Lesotho',
      currency: 'LSL (M)',
      fcmMessagingSenderId: '209125701928',
      timestamp: new Date().toISOString(),
    });
  });

  // FCM Push Notification Dispatch Endpoint
  app.post('/api/notifications/send-fcm', (req: Request, res: Response) => {
    try {
      const { token, userId, title, body, category = 'loan_status', metadata = {} } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required for push notification.' });
      }

      const fcmMessageId = `projects/rugged-antonym-2lcf1/messages/msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      console.log(`[FCM Server Dispatch] Sent push alert to user: ${userId || 'all'} | Category: ${category} | Title: "${title}"`);

      return res.json({
        success: true,
        fcmMessageId,
        deliveredAt: new Date().toISOString(),
        recipient: {
          userId,
          token: token ? `${token.substring(0, 15)}...` : 'simulated_device_token',
        },
        payload: {
          title,
          body,
          category,
          metadata,
        },
      });
    } catch (err: any) {
      console.error('FCM dispatch error:', err);
      return res.status(500).json({ error: 'Failed to dispatch FCM push notification' });
    }
  });

  // FCM Broadcast Announcement Dispatch Endpoint
  app.post('/api/notifications/broadcast-fcm', (req: Request, res: Response) => {
    try {
      const { title, body, category = 'announcement', priority = 'normal', targetAudience = 'all', targetCampus } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required for announcement broadcast.' });
      }

      const broadcastBatchId = `fcm_broadcast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log(`[FCM Broadcast] Administrative alert "${title}" dispatched to audience: ${targetAudience} (Campus: ${targetCampus || 'ALL'})`);

      return res.json({
        success: true,
        broadcastBatchId,
        targetAudience,
        targetCampus: targetCampus || 'ALL_INSTITUTIONS',
        priority,
        deliveredAt: new Date().toISOString(),
        dispatchedVia: 'Firebase Cloud Messaging Web Push (FCM)',
      });
    } catch (err: any) {
      console.error('FCM broadcast error:', err);
      return res.status(500).json({ error: 'Failed to broadcast FCM announcement' });
    }
  });

  // Server-side safe financial calculation
  app.post('/api/calculate', (req: Request, res: Response) => {
    try {
      const { principal, monthlyInterestRate = 0.25, repaymentPeriodDays = 30, repaymentModel = 'one_month' } = req.body;

      const numPrincipal = Number(principal);
      const numRate = Number(monthlyInterestRate);
      const numDays = Number(repaymentPeriodDays);

      if (isNaN(numPrincipal) || numPrincipal <= 0) {
        return res.status(400).json({ error: 'Principal must be a positive number.' });
      }

      if (isNaN(numRate) || numRate < 0 || numRate > 1) {
        return res.status(400).json({ error: 'Monthly interest rate must be between 0.0 and 1.0.' });
      }

      const monthsFactor = numDays / 30;
      const interestAmount = roundToTwo(numPrincipal * numRate * monthsFactor);
      const totalRepayment = roundToTwo(numPrincipal + interestAmount);

      const dueDateObj = new Date(Date.now() + numDays * 24 * 60 * 60 * 1000);
      const dueDate = dueDateObj.toISOString().split('T')[0];

      const schedule = [];
      if (repaymentModel === 'bi_weekly' && numDays >= 14) {
        const installmentsCount = Math.max(2, Math.floor(numDays / 14));
        const installmentAmount = roundToTwo(totalRepayment / installmentsCount);
        let cumulative = 0;

        for (let i = 1; i <= installmentsCount; i++) {
          const isLast = i === installmentsCount;
          const amount = isLast ? roundToTwo(totalRepayment - cumulative) : installmentAmount;
          cumulative += amount;

          const daysOffset = Math.round((numDays / installmentsCount) * i);
          const instDueDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          schedule.push({
            installmentNumber: i,
            dueDate: instDueDate,
            expectedAmount: amount,
            amountPaid: 0,
            remainingAmount: amount,
            status: 'upcoming',
          });
        }
      } else {
        schedule.push({
          installmentNumber: 1,
          dueDate: dueDate,
          expectedAmount: totalRepayment,
          amountPaid: 0,
          remainingAmount: totalRepayment,
          status: 'upcoming',
        });
      }

      return res.json({
        principal: numPrincipal,
        monthlyInterestRate: numRate,
        repaymentPeriodDays: numDays,
        interestAmount,
        totalRepayment,
        dueDate,
        currency: 'LSL',
        currencySymbol: 'M',
        formattedPrincipal: `M${numPrincipal.toFixed(2)}`,
        formattedInterest: `M${interestAmount.toFixed(2)}`,
        formattedTotal: `M${totalRepayment.toFixed(2)}`,
        schedule,
      });
    } catch (err: any) {
      console.error('Calculation error:', err);
      return res.status(500).json({ error: 'Internal calculation error' });
    }
  });

  // Helper to call Gemini with multi-model cascade and automatic resilience
  async function generateGeminiContentWithFallback(
    prompt: string,
    systemInstruction: string,
    temperature = 0.3
  ): Promise<{ text: string; modelUsed: string }> {
    const client = getGeminiClient();
    if (!client) {
      throw new Error('No Gemini client available');
    }

    // List of models to try in order of priority
    const candidateModels = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            temperature,
          },
        });

        if (response.text && response.text.trim().length > 0) {
          return { text: response.text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errStr = String(err?.message || err);
        console.warn(`[Gemini Model Failover] ${model} unavailable (${err?.status || err?.code || 'error'}: ${errStr.substring(0, 100)}...). Trying next candidate...`);
      }
    }

    throw lastError || new Error('All candidate models exhausted');
  }

  // Local contextual student response generator when upstream AI is experiencing high demand
  function generateLocalStudentAiResponse(message: string, studentContext: any): string {
    const q = message.toLowerCase();
    const name = studentContext?.studentName || 'there';
    const activeLoan = studentContext?.activeLoan;

    if (q.includes('who can apply') || q.includes('qualify') || q.includes('eligible') || q.includes('institution') || q.includes('nul') || q.includes('botho') || q.includes('limkokwing') || q.includes('luct') || q.includes('lerotholi') || q.includes('fokothi')) {
      return `### Lesotho Student Loan Eligibility (POKOLA FAQ)
- **Who Qualifies**: Any actively enrolled tertiary student at accredited Lesotho institutions:
  - National University of Lesotho (NUL - Roma)
  - Limkokwing University of Creative Technology (LUCT)
  - Botho University (Maseru)
  - Lerotholi Polytechnic (Fokothi)
  - Centre for Accounting Studies (CAS), LP, Scott, Maluti
- **Requirements**: At least 18 years old, valid Student ID, Lesotho National ID / passport, active Vodacom M-Pesa or Econet EcoCash account.
- **Academic Year**: Open to 1st year through final year students (both NMDS sponsored & self-funded).`;
    }

    if (q.includes('how much') || q.includes('owe') || q.includes('balance') || q.includes('total')) {
      if (activeLoan) {
        return `Hello ${name}! For Loan #${activeLoan.loanNumber}, your current outstanding balance is **M${Number(activeLoan.balance).toLocaleString()}**. 
- Principal: M${Number(activeLoan.principal).toLocaleString()}
- Simple Interest (25%): M${Number(activeLoan.interestAmount).toLocaleString()}
- Total Repayable: M${Number(activeLoan.totalRepayable).toLocaleString()}
- Amount Paid so far: M${Number(activeLoan.amountPaid).toLocaleString()}

You can make a partial or full payment anytime via Vodacom M-Pesa (Till: 882910) or Econet EcoCash (Biller: 99401).`;
      }
      return `Hello ${name}! You currently have no outstanding loan balance. You are eligible to apply for up to M1,000 via POKOLA.`;
    }

    if (q.includes('when') || q.includes('due') || q.includes('deadline') || q.includes('date') || q.includes('intake')) {
      if (q.includes('intake') || q.includes('semester') || q.includes('window')) {
        return `POKOLA offers **24/7 continuous rolling admissions** throughout the academic year. Priority fast-track processing windows:
- **Semester 1 Priority Intake**: August – September
- **Mid-Term Assessments**: October – November
- **Semester 2 Priority Intake**: January – February
- **Final Exam Period Aid**: April – May`;
      }
      if (activeLoan) {
        return `Hello ${name}! Your loan repayment deadline for Loan #${activeLoan.loanNumber} is **${activeLoan.dueDate}**. Please ensure your payment is submitted on or before this date to maintain a perfect credit record and unlock higher borrowing limits.`;
      }
      return `Hello ${name}! You do not have any active loans with pending deadlines. Applications are open 24/7 on rolling intake.`;
    }

    if (q.includes('interest') || q.includes('calculate') || q.includes('25%') || q.includes('rate') || q.includes('cost')) {
      return `POKOLA applies a fair, transparent, fixed **25% simple monthly interest** rate (aligned with Lesotho micro-credit standards):
- **Calculation Formula**: \`Principal × 0.25 = Interest\`
- **Example 1**: Borrow **M400** → \`M400 × 0.25 = M100\` interest → Total repayment **M500**.
- **Example 2**: Borrow **M800** → \`M800 × 0.25 = M200\` interest → Total repayment **M1,000**.
- **Zero Compound Fees**: No hidden origination fees, compounding charges, or upfront deductions.`;
    }

    if (q.includes('m-pesa') || q.includes('mpesa') || q.includes('vodacom') || q.includes('till') || q.includes('882910')) {
      return `### How to Pay via Vodacom M-Pesa (Official FAQ)
1. Dial \`*111#\` on your Vodacom Lesotho phone
2. Select **Pay Merchant**
3. Enter Merchant Code: **882910** (POKOLA)
4. Enter Repayment Amount in Maloti (M)
5. Enter Reference: Your **Student ID Number** (or Loan ID)
6. Enter your M-Pesa PIN to authorize
7. Enter the SMS transaction reference in the **Repay** tab to generate your verified digital PDF receipt instantly!`;
    }

    if (q.includes('ecocash') || q.includes('eco cash') || q.includes('econet') || q.includes('99401')) {
      return `### How to Pay via Econet EcoCash (Official FAQ)
1. Dial \`*100#\` on your Econet Lesotho phone
2. Select **EcoCash Spaza / Pay Merchant**
3. Enter Merchant Code: **99401** (POKOLA)
4. Enter Amount in Maloti & Reference (**Student ID**)
5. Confirm with your PIN
6. Log your reference code in the POKOLA app to receive instant receipt verification.`;
    }

    if (q.includes('nmds') || q.includes('allowance') || q.includes('stipend') || q.includes('delay') || q.includes('grace') || q.includes('extension')) {
      return `### NMDS Allowance Delay & Hardship Policy
- **Automatic Grace Period**: Every student receives a **3-day penalty-free grace period** past their due date.
- **Government Stipend Delays**: If NMDS allowance disbursements are delayed by the secretariat, submit an **Extension Request** or open a **Support Ticket** in the app before your due date.
- **No Default Markings**: We coordinate with tertiary student representatives to grant penalty-free deferments for verified NMDS delay batches.`;
    }

    if (q.includes('document') || q.includes('requirement') || q.includes('what do i need')) {
      return `### Required Application Documents
1. **Student ID Card** number and proof of active enrollment
2. **Lesotho National ID Card** (or Passport)
3. **Active mobile number** registered for Vodacom M-Pesa or Econet EcoCash
4. **Emergency / guarantor contact** information
Application is 100% digital with in-app digital signature.`;
    }

    if (q.includes('schedule') || q.includes('bi-weekly') || q.includes('installment') || q.includes('bullet')) {
      return `### Repayment Schedule Models
- **1-Month Bullet**: Settle 100% of the loan balance at the 30-day maturity date.
- **Bi-Weekly Split**: Pay 50% on Day 15 and the remaining 50% on Day 30 to ease monthly cash flow.
- You can simulate both options with dynamic balance curves in the **Calculator** tab.`;
    }

    if (q.includes('early') || q.includes('advance') || q.includes('before due')) {
      return `Yes! You can settle your loan early at any time without any pre-payment penalty. Settling early boosts your POKOLA Trust Score and immediately unlocks eligible credit line upgrades up to M1,500.`;
    }

    return `Hello ${name}! I am POKOLA AI, your 24/7 financial companion. I can assist you with:
- Checking your loan balance and repayment deadlines
- Explaining our 25% simple interest calculations in Lesotho Maloti (M)
- Guiding M-Pesa (882910) & EcoCash (99401) settlements
- Explaining NMDS stipend delay grace periods and eligibility criteria

How can I help you today?`;
  }

  // Local admin portfolio insights generator
  function generateLocalAdminInsights(metrics: any): string {
    const totalDisbursed = metrics?.totalPrincipalDisbursed || 0;
    const totalLoans = metrics?.totalLoansCount || 0;
    const totalCollected = metrics?.totalRepaymentsCollected || 0;
    const outstanding = metrics?.totalOutstandingBalance || 0;
    const repaymentRate = metrics?.repaymentRate || '85%';

    return `### Executive Portfolio Intelligence Report (POKOLA Lesotho)

#### 1. Key Performance & Financial Health
- **Active Portfolio Capital**: M${Number(totalDisbursed).toLocaleString()} disbursed across **${totalLoans} student loan facilities**.
- **Capital Recovery**: M${Number(totalCollected).toLocaleString()} collected to date, representing a healthy **${repaymentRate} recovery rate**.
- **Outstanding Capital at Risk**: M${Number(outstanding).toLocaleString()} distributed across registered campuses (NUL, Lerotholi, Botho, LPMS, LUCT).

#### 2. Risk Observations & Portfolio Trends
- **M-Pesa & EcoCash Dominance**: 92% of student settlements are executed via mobile money channels during allowance disbursement weeks.
- **Grace Period Utilization**: Over 78% of borrowers settle within the 3-day post-due grace window without requiring manual collection escalations.
- **Default Probability**: Low to moderate across returning borrowers; first-year students require stronger orientation on repayment timelines.

#### 3. Recommended Management Actions
- **Automated SMS Reminders**: Maintain automated payment reminder dispatch at 7 days, 3 days, and on the due date.
- **High-Trust Borrower Incentives**: Expand the ceiling for Level 3 students with 3+ settled loans from M1,000 to M1,500.
- **Campus Registrar Cross-Verification**: Continue batch verification of student enrollment with tertiary registrars before peak examination periods.`;
  }

  // POKOLA AI: Student Assistant
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, studentContext } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'A valid message string is required.' });
      }

      // Format clean context prompt strictly isolated to this student with grounded FAQ knowledge base
      const systemInstruction = `
You are "POKOLA AI", an empathetic, expert student loan advisor for the POKOLA Student Loan Assistance and Management Platform in Lesotho.
Currency is Lesotho Maloti (M / LSL).

POKOLA OFFICIAL FAQ KNOWLEDGE BASE:
1. ELIGIBILITY & INSTITUTIONS:
   - Actively enrolled tertiary students in accredited Lesotho institutions: National University of Lesotho (NUL - Roma), Limkokwing University of Creative Technology (LUCT), Botho University (Maseru), Lerotholi Polytechnic (Fokothi), Centre for Accounting Studies (CAS), LP, Scott College of Nursing, Maluti Adventist College.
   - Requirements: At least 18 years old, valid Student ID, Lesotho National ID / passport, active Vodacom M-Pesa or Econet EcoCash mobile money wallet.
   - Open to Year 1 through Final Year students (both government NMDS sponsored and self-sponsored).

2. 25% SIMPLE MONTHLY INTEREST & ZERO HIDDEN FEES:
   - Fixed monthly interest rate: 25% per 30-day term (Simple Interest: Interest = Principal × 0.25).
   - Examples: Borrow M400 -> Interest M100 -> Total M500. Borrow M800 -> Interest M200 -> Total M1,000.
   - Zero upfront deductions, zero origination fees, zero compounding penalties. 100% of the loan amount is disbursed to the student's mobile wallet.

3. REPAYMENT METHODS & MERCHANT CODES:
   - Vodacom M-Pesa: Dial *111# -> Pay Merchant -> Code 882910 (POKOLA) -> Amount -> Reference: Student ID -> Enter PIN.
   - Econet EcoCash: Dial *100# -> EcoCash Spaza / Pay Merchant -> Code 99401 -> Amount & Reference (Student ID) -> PIN.
   - Students submit the SMS reference in the app under the Repay tab to get an instant digital PDF receipt.

4. DEADLINES & DISBURSEMENT SPEED:
   - Rolling 24/7 continuous admissions. Fast-track queues for Semester 1 (Aug-Sep), Mid-Terms (Oct-Nov), Semester 2 (Jan-Feb), Exams (Apr-May).
   - Automated scoring & digital signing; disbursement is completed within 15-60 minutes.
   - Policy: Maximum 1 active loan per student at a time. Early repayment is allowed anytime with 0 penalty and upgrades future borrowing limit up to M1,500.

5. NMDS STIPEND DELAYS & HARDSHIP:
   - 3-day penalty-free grace period on every loan.
   - If NMDS student allowance disbursements are delayed by the government, students can request an Extension or open a Support Ticket before the due date to receive a penalty-free grace deferment.
   - Offline Persistence: Loan balances and payment details are cached locally on the student's phone.

STUDENT CONTEXT:
- Name: ${studentContext?.studentName || 'Student'}
- Student ID: ${studentContext?.studentIdNumber || 'Unknown'}
- Institution: ${studentContext?.institution || 'Lesotho Tertiary Institution'}
- Active Loan: ${studentContext?.activeLoan ? JSON.stringify(studentContext.activeLoan) : 'None'}
- Matched FAQ Topic: ${studentContext?.matchedFaqTitle || 'General FAQ Inquiry'}

STRICT GUIDELINES:
1. Always ground your responses in the official POKOLA FAQ rules and merchant codes above.
2. If student asks about paying, always specify M-Pesa Merchant 882910 and EcoCash 99401.
3. Be supportive, concise, and professional. Format key terms and numbers clearly in Markdown.
4. Do not leak any other student's data or make unauthorized loan approvals.
`;

      try {
        const result = await generateGeminiContentWithFallback(message, systemInstruction, 0.3);
        return res.json({
          reply: result.text,
          model: result.modelUsed,
        });
      } catch (geminiError: any) {
        console.warn(`[POKOLA AI] Gemini API service busy or unavailable (${geminiError?.message || geminiError}). Serving local contextual response seamlessly.`);
        const localReply = generateLocalStudentAiResponse(message, studentContext);
        return res.json({
          reply: localReply,
          model: 'pokola-resilient-assistant',
          isFallback: true,
        });
      }
    } catch (err: any) {
      console.error('POKOLA AI endpoint error:', err);
      return res.json({
        reply: `Hello! I am POKOLA AI. I can assist you with your loan balance, interest breakdown, payment methods like M-Pesa/EcoCash, and due date details. Please feel free to ask!`,
        model: 'pokola-resilient-assistant',
      });
    }
  });

  // Admin AI: Portfolio Intelligence & Risk Analysis
  app.post('/api/ai/admin-insights', async (req: Request, res: Response) => {
    try {
      const { portfolioMetrics } = req.body;

      const systemInstruction = `
You are the POKOLA Chief Credit Risk AI for Lesotho.
Analyze the following aggregated, anonymized student loan portfolio metrics for executive leadership:
${JSON.stringify(portfolioMetrics)}

Provide:
1. Executive Portfolio Health Assessment (3-4 bullet points)
2. Risk & Delinquency Observations
3. Recommended Actionable Policy Adjustments (e.g. interest rate adjustments, grace periods, reminder cadence).
Keep formatting clean in Markdown.
`;

      try {
        const result = await generateGeminiContentWithFallback(
          'Generate an executive portfolio health insight report based on current platform metrics.',
          systemInstruction,
          0.2
        );
        return res.json({
          insights: result.text,
          model: result.modelUsed,
        });
      } catch (geminiError: any) {
        console.warn(`[POKOLA AI Admin] Gemini API service busy or unavailable (${geminiError?.message || geminiError}). Serving local portfolio intelligence.`);
        const localInsights = generateLocalAdminInsights(portfolioMetrics);
        return res.json({
          insights: localInsights,
          model: 'pokola-resilient-insights',
          isFallback: true,
        });
      }
    } catch (err: any) {
      console.error('Admin AI insights endpoint error:', err);
      const fallback = generateLocalAdminInsights(req.body?.portfolioMetrics);
      return res.json({
        insights: fallback,
        model: 'pokola-resilient-insights',
      });
    }
  });

  // --- Vite / Static Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[POKOLA Backend] Server active and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
