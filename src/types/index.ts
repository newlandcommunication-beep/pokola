export type UserRole = 'student' | 'loan_officer' | 'admin' | 'super_admin';

export type LoanStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'accepted'
  | 'active'
  | 'partially_paid'
  | 'fully_paid'
  | 'overdue'
  | 'defaulted'
  | 'cancelled';

export type RepaymentInstallmentStatus = 'upcoming' | 'due' | 'partially_paid' | 'paid' | 'overdue';

export type RepaymentMethod = 'mpesa' | 'ecocash' | 'bank_transfer' | 'cash' | 'other';

export interface RepaymentScheduleItem {
  installmentNumber: number;
  dueDate: string;
  expectedAmount: number;
  amountPaid: number;
  remainingAmount: number;
  status: RepaymentInstallmentStatus;
  paidDate?: string;
}

export interface UserProfile {
  id: string;
  uid?: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string;
  dateOfBirth: string;
  studentIdNumber: string;
  institution: string;
  faculty: string;
  yearOfStudy: number;
  residentialAddress: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  preferredRepaymentMethod: RepaymentMethod;
  isVerified: boolean;
  documentsUploaded: {
    studentIdCard?: string;
    proofOfRegistration?: string;
    nationalId?: string;
  };
  createdAt: string;
  avatarUrl?: string;
}

export interface LoanCalculationResult {
  principal: number;
  monthlyInterestRate: number; // e.g. 0.25 (25%)
  interestAmount: number;
  totalRepayment: number;
  repaymentPeriodDays: number;
  dueDate: string;
  currency: string;
  formattedPrincipal: string;
  formattedInterest: string;
  formattedTotal: string;
  dailyRateEquivalent: number;
  schedule: RepaymentScheduleItem[];
}

export interface RiskEvaluation {
  riskScore: number; // 0 - 100 (higher is safer)
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  maxAllowedLoan: number;
}

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  institution: string;
  studentIdNumber: string;
  requestedAmount: number;
  purpose: string;
  monthlyInterestRate: number;
  calculatedInterest: number;
  totalRepayment: number;
  repaymentPeriodDays: number;
  repaymentModel: 'one_month' | 'bi_weekly' | 'custom';
  status: LoanStatus;
  riskEvaluation: RiskEvaluation;
  rejectionReason?: string;
  officerNotes?: string;
  additionalInfoRequired?: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerName?: string;
  approvedAt?: string;
  acceptedAt?: string;
}

export interface LoanAgreementSignature {
  acceptedAt: string;
  ipAddress: string;
  acknowledgedTerms: boolean;
  legalName: string;
  deviceInfo: string;
  acceptanceReference: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  institution: string;
  studentIdNumber: string;
  principal: number;
  monthlyInterestRate: number;
  interestAmount: number;
  totalRepayable: number;
  amountPaid: number;
  balance: number;
  status: LoanStatus;
  disbursedAt: string;
  dueDate: string;
  repaymentPeriodDays: number;
  lateFeeAccrued: number;
  schedule: RepaymentScheduleItem[];
  agreementSignature: LoanAgreementSignature;
  lastPaymentDate?: string;
  closedAt?: string;
}

export interface Repayment {
  id: string;
  receiptNumber: string;
  loanId: string;
  loanNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  date: string;
  paymentMethod: RepaymentMethod;
  transactionReference: string;
  recordedBy: string;
  recordedByName: string;
  notes?: string;
  status: 'confirmed' | 'pending_verification';
}

export interface EligibilityRules {
  requireVerifiedId: boolean;
  requireActiveEnrollment: boolean;
  maxOutstandingBalance: number;
  allowOverdueBorrowers: boolean;
  minStudyYear: number;
  requireProofOfRegistration: boolean;
  minAgeYears: number;
}

export interface BusinessSettings {
  maxLoanAmount: number; // Default M1,000
  minLoanAmount: number; // Default M100
  monthlyInterestRate: number; // Default 0.25 (25%)
  defaultRepaymentPeriodDays: number; // Default 30 days
  lateFeePercent: number; // Default 5%
  gracePeriodDays: number; // Default 3 days
  eligibilityRules: EligibilityRules;
  reminderTimingDays: number[]; // e.g. [7, 3, 1, 0, -3]
  paymentMethodsEnabled: RepaymentMethod[];
  legalEntityName: string;
  registrationNumber: string;
  regulatoryNotice: string;
  contactSupportEmail: string;
  contactSupportPhone: string;
  supportHours: string;
  physicalAddress: string;
  currencyCode: string;
  currencySymbol: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  affectedRecordType: 'LOAN' | 'APPLICATION' | 'REPAYMENT' | 'USER' | 'SETTINGS' | 'SYSTEM' | 'AGREEMENT';
  affectedRecordId: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  details: string;
}

export type NotificationCategory = 'loan_status' | 'repayment_deadline' | 'announcement' | 'system';

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  category?: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  fcmMessageId?: string;
  metadata?: {
    loanId?: string;
    loanNumber?: string;
    applicationId?: string;
    applicationNumber?: string;
    amount?: number;
    dueDate?: string;
    daysRemaining?: number;
    announcementId?: string;
    priority?: 'normal' | 'high' | 'urgent';
  };
}

export type AnnouncementCategory = 'general' | 'deadline' | 'policy' | 'maintenance' | 'bursary';
export type AnnouncementPriority = 'normal' | 'high' | 'urgent';
export type AnnouncementTargetAudience = 'all' | 'active_borrowers' | 'overdue' | 'specific_campus';

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  targetAudience: AnnouncementTargetAudience;
  targetCampus?: string;
  authorId: string;
  authorName: string;
  sentViaFCM: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface PushNotificationPreferences {
  pushEnabled: boolean;
  soundEnabled: boolean;
  loanStatusAlerts: boolean;
  repaymentReminders: boolean;
  announcementsAlerts: boolean;
  fcmToken?: string | null;
  permissionStatus: 'default' | 'granted' | 'denied' | 'unsupported';
}

export interface FCMDeviceToken {
  id: string;
  userId: string;
  userName: string;
  token: string;
  deviceType: 'web' | 'ios' | 'android';
  browser: string;
  notificationEnabled: boolean;
  lastUpdated: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  category: 'loan_terms' | 'repayment_issue' | 'eligibility' | 'technical' | 'other';
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  replies: {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type SyncItemType = 
  | 'AUDIT_LOG' 
  | 'LOAN_CREATE' 
  | 'LOAN_UPDATE' 
  | 'LOAN_REPAYMENT' 
  | 'APPLICATION_CREATE' 
  | 'APPLICATION_UPDATE';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  collection: 'auditLogs' | 'loans' | 'repayments' | 'loanApplications' | 'users';
  docId: string;
  payload: any;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  summary: string;
}

export interface SyncServiceState {
  status: SyncStatus;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingCount: number;
  pendingAuditCount: number;
  pendingLoanCount: number;
  lastSyncTimestamp: string | null;
  lastSyncSuccessCount: number;
  totalSyncedCount: number;
  syncErrors: string[];
  isAutoSyncEnabled: boolean;
}
