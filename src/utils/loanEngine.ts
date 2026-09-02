import { 
  LoanCalculationResult, 
  RepaymentScheduleItem, 
  RiskEvaluation, 
  UserProfile, 
  BusinessSettings, 
  Loan 
} from '../types';

/**
 * Supported interest calculation models
 */
export type InterestModel = 'simple_monthly' | 'flat' | 'pro_rata_daily' | 'amortized';

/**
 * Configuration options for the loan calculation model
 */
export interface LoanModelConfig {
  monthlyInterestRate?: number;       // e.g., 0.25 for 25%
  annualInterestRate?: number;        // e.g., 3.00 for 300% APR
  repaymentPeriodDays?: number;       // Default: 30
  model?: InterestModel;              // Calculation model, defaults to 'simple_monthly'
  dayCountBasis?: 30 | 360 | 365;     // Day count convention, defaults to 30
  processingFeePercent?: number;      // e.g. 0.00
  fixedProcessingFee?: number;        // e.g. 0.00
  minInterestAmount?: number;         // Floor on minimum interest charged
}

/**
 * Convert monetary amount to integer cents to prevent floating point inaccuracies
 */
export function toCents(amount: number): number {
  if (!amount || isNaN(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100);
}

/**
 * Convert integer cents back to two-decimal float
 */
export function fromCents(cents: number): number {
  if (!cents || isNaN(cents)) return 0;
  return cents / 100;
}

/**
 * Decimal-safe rounding to 2 decimal places using epsilon correction
 */
export function roundMoney(amount: number): number {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 0;
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Currency formatter for Lesotho Maloti (M)
 */
export function formatMaloti(amount: number | undefined | null, includeDecimals = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'M0.00';
  }
  const formatted = amount.toLocaleString('en-LS', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });
  return `M${formatted}`;
}

/**
 * Format percentage helper (e.g. 0.25 -> "25%")
 */
export function formatPercent(rate: number | undefined | null): string {
  if (rate === undefined || rate === null || isNaN(rate)) {
    return '0%';
  }
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Centralized Interest Calculation
 * Computes interest using the specified configurable model with decimal-safe arithmetic.
 * 
 * @param principal The requested loan principal in Maloti
 * @param rateOrConfig Monthly rate number (e.g. 0.25) or full LoanModelConfig
 * @param termDays Number of days for repayment (default: 30)
 * @returns Decimal-safe interest amount in Maloti
 */
export function calculateInterest(
  principal: number,
  rateOrConfig: number | LoanModelConfig = 0.25,
  termDays = 30
): number {
  const safePrincipal = Math.max(0, roundMoney(principal));
  if (safePrincipal === 0) return 0;

  const config: LoanModelConfig = typeof rateOrConfig === 'number'
    ? { monthlyInterestRate: rateOrConfig, repaymentPeriodDays: termDays, model: 'simple_monthly' }
    : { monthlyInterestRate: 0.25, repaymentPeriodDays: termDays, model: 'simple_monthly', ...rateOrConfig };

  const rate = Math.max(0, config.monthlyInterestRate ?? 0.25);
  const days = Math.max(1, config.repaymentPeriodDays ?? termDays);
  const model = config.model ?? 'simple_monthly';
  const basis = config.dayCountBasis ?? 30;

  let calculatedInterestCents = 0;
  const principalCents = toCents(safePrincipal);

  switch (model) {
    case 'flat':
      // Flat simple rate applied directly to principal (e.g., 25% flat)
      calculatedInterestCents = Math.round(principalCents * rate);
      break;

    case 'pro_rata_daily':
      // Pro-rata based on actual 365 or 360 annual day count
      const annualRate = config.annualInterestRate ?? (rate * 12);
      const dailyFactor = annualRate / (basis === 365 ? 365 : 360);
      calculatedInterestCents = Math.round(principalCents * dailyFactor * days);
      break;

    case 'amortized':
      // Short-term simplified amortized compounding
      const monthlyRateAmort = rate;
      const periods = days / 30;
      const amortTotal = safePrincipal * Math.pow(1 + monthlyRateAmort, periods);
      calculatedInterestCents = Math.max(0, toCents(amortTotal) - principalCents);
      break;

    case 'simple_monthly':
    default:
      // Standard Lesotho micro-credit formula:
      // Interest = Principal * Monthly Rate * (Term Days / 30)
      const periodFactor = days / 30;
      calculatedInterestCents = Math.round(principalCents * rate * periodFactor);
      break;
  }

  // Enforce minimum interest floor if specified
  if (config.minInterestAmount && config.minInterestAmount > 0) {
    const minCents = toCents(config.minInterestAmount);
    if (calculatedInterestCents < minCents) {
      calculatedInterestCents = minCents;
    }
  }

  return fromCents(calculatedInterestCents);
}

/**
 * Centralized Total Repayment Calculation
 * Computes total amount to be repaid (Principal + Calculated Interest + Optional Fees)
 * with decimal-safe integer cent arithmetic.
 * 
 * @param principal The requested loan principal in Maloti
 * @param rateOrConfig Monthly rate number or configuration object
 * @param termDays Number of repayment days (default: 30)
 * @returns Decimal-safe total repayment amount in Maloti
 */
export function calculateTotalRepayment(
  principal: number,
  rateOrConfig: number | LoanModelConfig = 0.25,
  termDays = 30
): number {
  const safePrincipal = Math.max(0, roundMoney(principal));
  const interest = calculateInterest(safePrincipal, rateOrConfig, termDays);

  const config: LoanModelConfig = typeof rateOrConfig === 'object' ? rateOrConfig : {};
  let feeCents = 0;

  if (config.fixedProcessingFee && config.fixedProcessingFee > 0) {
    feeCents += toCents(config.fixedProcessingFee);
  }

  if (config.processingFeePercent && config.processingFeePercent > 0) {
    feeCents += Math.round(toCents(safePrincipal) * config.processingFeePercent);
  }

  const totalCents = toCents(safePrincipal) + toCents(interest) + feeCents;
  return fromCents(totalCents);
}

/**
 * Calculate loan parameters and schedule based on principal, rate, and period.
 */
export function calculateLoan(
  principal: number,
  monthlyInterestRate: number, // e.g., 0.25 for 25%
  repaymentPeriodDays = 30,
  repaymentModel: 'one_month' | 'bi_weekly' | 'custom' = 'one_month',
  startDate: Date = new Date()
): LoanCalculationResult {
  const safePrincipal = Math.max(0, roundMoney(principal));
  const safeRate = Math.max(0, monthlyInterestRate);
  
  const interestAmount = calculateInterest(safePrincipal, safeRate, repaymentPeriodDays);
  const totalRepayment = calculateTotalRepayment(safePrincipal, safeRate, repaymentPeriodDays);

  // Calculate Due Date
  const dueDateObj = new Date(startDate.getTime() + repaymentPeriodDays * 24 * 60 * 60 * 1000);
  const dueDate = dueDateObj.toISOString().split('T')[0];

  // Build Repayment Schedule
  const schedule: RepaymentScheduleItem[] = [];

  if (repaymentModel === 'bi_weekly' && repaymentPeriodDays >= 14) {
    const installmentsCount = Math.max(2, Math.floor(repaymentPeriodDays / 14));
    const totalCents = toCents(totalRepayment);
    const baseInstallmentCents = Math.floor(totalCents / installmentsCount);
    let cumulativeCents = 0;

    for (let i = 1; i <= installmentsCount; i++) {
      const isLast = i === installmentsCount;
      const currentCents = isLast ? (totalCents - cumulativeCents) : baseInstallmentCents;
      cumulativeCents += currentCents;
      const amount = fromCents(currentCents);
      
      const installmentDays = Math.round((repaymentPeriodDays / installmentsCount) * i);
      const instDueDateObj = new Date(startDate.getTime() + installmentDays * 24 * 60 * 60 * 1000);

      schedule.push({
        installmentNumber: i,
        dueDate: instDueDateObj.toISOString().split('T')[0],
        expectedAmount: amount,
        amountPaid: 0,
        remainingAmount: amount,
        status: 'upcoming',
      });
    }
  } else {
    // Single Bullet Installment on Due Date
    schedule.push({
      installmentNumber: 1,
      dueDate: dueDate,
      expectedAmount: totalRepayment,
      amountPaid: 0,
      remainingAmount: totalRepayment,
      status: 'upcoming',
    });
  }

  const dailyRateEquivalent = roundMoney((safeRate / 30) * 100);

  return {
    principal: safePrincipal,
    monthlyInterestRate: safeRate,
    interestAmount,
    totalRepayment,
    repaymentPeriodDays,
    dueDate,
    currency: 'LSL',
    formattedPrincipal: formatMaloti(safePrincipal),
    formattedInterest: formatMaloti(interestAmount),
    formattedTotal: formatMaloti(totalRepayment),
    dailyRateEquivalent,
    schedule,
  };
}

/**
 * Generate configurable installment breakdown with penny-rounding compensation
 */
export function generateInstallmentSchedule(
  totalAmount: number,
  installmentsCount: number,
  startDate: Date = new Date(),
  intervalDays = 14
): RepaymentScheduleItem[] {
  const safeTotal = Math.max(0, roundMoney(totalAmount));
  const count = Math.max(1, installmentsCount);
  const totalCents = toCents(safeTotal);
  const baseCents = Math.floor(totalCents / count);
  let accumulatedCents = 0;

  const schedule: RepaymentScheduleItem[] = [];

  for (let i = 1; i <= count; i++) {
    const isLast = i === count;
    const currentCents = isLast ? (totalCents - accumulatedCents) : baseCents;
    accumulatedCents += currentCents;
    const amount = fromCents(currentCents);

    const dueDateObj = new Date(startDate.getTime() + (i * intervalDays) * 24 * 60 * 60 * 1000);

    schedule.push({
      installmentNumber: i,
      dueDate: dueDateObj.toISOString().split('T')[0],
      expectedAmount: amount,
      amountPaid: 0,
      remainingAmount: amount,
      status: 'upcoming',
    });
  }

  return schedule;
}

/**
 * Evaluate student eligibility against configured business rules
 */
export function evaluateEligibility(
  student: UserProfile,
  existingLoans: Loan[],
  requestedAmount: number,
  settings: BusinessSettings
): {
  isEligible: boolean;
  checks: {
    rule: string;
    passed: boolean;
    description: string;
    critical: boolean;
  }[];
  reason?: string;
} {
  const checks = [];

  // Check 1: Registered & active student profile
  const profileComplete = Boolean(
    student.fullName &&
    student.studentIdNumber &&
    student.institution &&
    student.phone &&
    student.emergencyContactPhone
  );
  checks.push({
    rule: 'Student Profile Complete',
    passed: profileComplete,
    description: profileComplete
      ? 'All essential student details and emergency contacts are provided'
      : 'Incomplete student profile. Please update personal and emergency details.',
    critical: true,
  });

  // Check 2: Verified ID
  if (settings.eligibilityRules.requireVerifiedId) {
    checks.push({
      rule: 'Student ID Verification',
      passed: student.isVerified,
      description: student.isVerified
        ? 'Student ID verified by institution registrar'
        : 'Student ID is pending verification or document upload.',
      critical: true,
    });
  }

  // Check 3: Study Year requirement
  const meetsYear = student.yearOfStudy >= settings.eligibilityRules.minStudyYear;
  checks.push({
    rule: `Minimum Study Year (${settings.eligibilityRules.minStudyYear}+)`,
    passed: meetsYear,
    description: meetsYear
      ? `Student is currently in Year ${student.yearOfStudy}`
      : `Students must be at least in Year ${settings.eligibilityRules.minStudyYear} of their academic program`,
    critical: true,
  });

  // Check 4: No Overdue Loans
  const studentLoans = existingLoans.filter((l) => l.studentId === student.id);
  const hasOverdueLoan = studentLoans.some((l) => l.status === 'overdue' || l.status === 'defaulted');
  
  if (!settings.eligibilityRules.allowOverdueBorrowers) {
    checks.push({
      rule: 'No Overdue Loans',
      passed: !hasOverdueLoan,
      description: !hasOverdueLoan
        ? 'No active default or overdue repayment records on POKOLA'
        : 'You currently have an overdue loan that must be settled first.',
      critical: true,
    });
  }

  // Check 5: Maximum Active Balance
  const totalActiveBalance = studentLoans
    .filter((l) => l.status === 'active' || l.status === 'partially_paid' || l.status === 'approved')
    .reduce((sum, l) => sum + l.balance, 0);

  const balanceWithinLimit = (totalActiveBalance + requestedAmount) <= settings.eligibilityRules.maxOutstandingBalance;
  checks.push({
    rule: `Outstanding Balance Ceiling (Max ${formatMaloti(settings.eligibilityRules.maxOutstandingBalance)})`,
    passed: balanceWithinLimit,
    description: balanceWithinLimit
      ? `Total combined balance (${formatMaloti(totalActiveBalance + requestedAmount)}) is within the ${formatMaloti(settings.eligibilityRules.maxOutstandingBalance)} limit`
      : `Requested amount would exceed your maximum borrowing limit of ${formatMaloti(settings.eligibilityRules.maxOutstandingBalance)}. Current active debt: ${formatMaloti(totalActiveBalance)}`,
    critical: true,
  });

  // Check 6: Loan Amount within Configured Bounds
  const withinMinMax = requestedAmount >= settings.minLoanAmount && requestedAmount <= settings.maxLoanAmount;
  checks.push({
    rule: `Loan Amount Limit (${formatMaloti(settings.minLoanAmount)} - ${formatMaloti(settings.maxLoanAmount)})`,
    passed: withinMinMax,
    description: withinMinMax
      ? `Requested amount of ${formatMaloti(requestedAmount)} is within valid platform boundaries`
      : `Loan amount must be between ${formatMaloti(settings.minLoanAmount)} and ${formatMaloti(settings.maxLoanAmount)}`,
    critical: true,
  });

  const isEligible = checks.filter((c) => c.critical).every((c) => c.passed);
  const failedReasons = checks.filter((c) => !c.passed).map((c) => c.description);

  return {
    isEligible,
    checks,
    reason: failedReasons.length > 0 ? failedReasons.join('. ') : undefined,
  };
}

/**
 * Calculate risk evaluation and credit scoring for loan review
 */
export function calculateRiskScore(
  student: UserProfile,
  studentLoans: Loan[],
  requestedAmount: number,
  settings: BusinessSettings
): RiskEvaluation {
  let score = 70; // baseline neutral
  const factors: string[] = [];

  // Previous payment history bonus
  const paidLoans = studentLoans.filter((l) => l.status === 'fully_paid');
  if (paidLoans.length >= 2) {
    score += 15;
    factors.push(`Proven track record: ${paidLoans.length} successfully settled loans on POKOLA`);
  } else if (paidLoans.length === 1) {
    score += 8;
    factors.push('1 previous loan fully settled on time');
  } else {
    factors.push('First-time borrower on platform');
  }

  // Study Year factor
  if (student.yearOfStudy >= 3) {
    score += 10;
    factors.push(`Senior student (Year ${student.yearOfStudy}) with established academic standing`);
  } else if (student.yearOfStudy === 1) {
    score -= 5;
    factors.push('First-year student (higher mobility)');
  }

  // Verification factor
  if (student.isVerified) {
    score += 10;
    factors.push('Student ID and institutional enrollment verified');
  } else {
    score -= 15;
    factors.push('Pending registrar ID verification');
  }

  // Overdue penalties
  const overdueCount = studentLoans.filter((l) => l.status === 'overdue' || l.status === 'defaulted').length;
  if (overdueCount > 0) {
    score -= 35;
    factors.push(`Warning: ${overdueCount} historical overdue/default occurrences`);
  }

  // Requested amount ratio
  const ratio = requestedAmount / settings.maxLoanAmount;
  if (ratio > 0.8) {
    score -= 5;
    factors.push('Borrowing near maximum tier threshold');
  } else if (ratio <= 0.4) {
    score += 5;
    factors.push('Conservative borrowing amount');
  }

  // Normalize score between 10 and 99
  const clampedScore = Math.max(10, Math.min(99, score));
  
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' = 'APPROVE';

  if (clampedScore >= 75) {
    riskLevel = 'LOW';
    recommendation = 'APPROVE';
  } else if (clampedScore >= 50) {
    riskLevel = 'MEDIUM';
    recommendation = 'REVIEW';
  } else {
    riskLevel = 'HIGH';
    recommendation = 'REJECT';
  }

  // Max allowed calculated from risk
  const maxAllowedLoan = riskLevel === 'LOW' 
    ? settings.maxLoanAmount 
    : riskLevel === 'MEDIUM' 
    ? Math.round(settings.maxLoanAmount * 0.7) 
    : Math.round(settings.maxLoanAmount * 0.4);

  return {
    riskScore: clampedScore,
    riskLevel,
    factors,
    recommendation,
    maxAllowedLoan,
  };
}

/**
 * Calculate days remaining or days overdue
 */
export function getDaysRemaining(dueDateString: string): {
  days: number;
  isOverdue: boolean;
  label: string;
} {
  const due = new Date(dueDateString);
  const now = new Date();
  
  // Set to start of day
  due.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      days: Math.abs(diffDays),
      isOverdue: true,
      label: `${Math.abs(diffDays)} days overdue`,
    };
  } else if (diffDays === 0) {
    return {
      days: 0,
      isOverdue: false,
      label: 'Due today',
    };
  } else {
    return {
      days: diffDays,
      isOverdue: false,
      label: `${diffDays} days remaining`,
    };
  }
}
