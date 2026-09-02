import { 
  NotificationItem, 
  AnnouncementItem, 
  Loan, 
  LoanApplication, 
  UserProfile, 
  NotificationCategory 
} from '../types';
import { formatMaloti } from '../utils/loanEngine';
import { playNotificationChime, showNativeBrowserNotification } from './fcm';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  category: NotificationCategory;
  actionUrl?: string;
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

/**
 * Construct structured Loan Status Push Notifications
 */
export function createLoanStatusNotification(
  studentId: string,
  event: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'settled' | 'overdue',
  appOrLoan: {
    number: string;
    amount: number;
    purpose?: string;
    dueDate?: string;
    notes?: string;
  }
): PushNotificationPayload {
  switch (event) {
    case 'submitted':
      return {
        userId: studentId,
        title: `📝 Application Received: ${appOrLoan.number}`,
        message: `Your student loan application for ${formatMaloti(appOrLoan.amount)} has been submitted and is currently in the verification queue.`,
        type: 'info',
        category: 'loan_status',
        actionUrl: 'portal:applications',
        metadata: {
          applicationNumber: appOrLoan.number,
          amount: appOrLoan.amount,
        },
      };

    case 'under_review':
      return {
        userId: studentId,
        title: `🔍 Application Under Review (${appOrLoan.number})`,
        message: `A POKOLA credit officer is actively verifying your academic registration. ${appOrLoan.notes ? `Note: ${appOrLoan.notes}` : 'Decision expected shortly.'}`,
        type: 'info',
        category: 'loan_status',
        actionUrl: 'portal:applications',
        metadata: {
          applicationNumber: appOrLoan.number,
          amount: appOrLoan.amount,
        },
      };

    case 'approved':
      return {
        userId: studentId,
        title: `🎉 Loan Approved: ${formatMaloti(appOrLoan.amount)}!`,
        message: `Congratulations! Application ${appOrLoan.number} is APPROVED. Please review and sign your digital loan agreement to trigger mobile money disbursement.`,
        type: 'success',
        category: 'loan_status',
        actionUrl: 'portal:applications',
        metadata: {
          applicationNumber: appOrLoan.number,
          amount: appOrLoan.amount,
          priority: 'high',
        },
      };

    case 'rejected':
      return {
        userId: studentId,
        title: `⚠️ Application Update: ${appOrLoan.number}`,
        message: `Your application could not be approved at this time. Reason: ${appOrLoan.notes || 'Institutional eligibility requirements not met.'}`,
        type: 'warning',
        category: 'loan_status',
        actionUrl: 'portal:applications',
        metadata: {
          applicationNumber: appOrLoan.number,
          amount: appOrLoan.amount,
        },
      };

    case 'disbursed':
      return {
        userId: studentId,
        title: `💸 Funds Disbursed: Loan #${appOrLoan.number}`,
        message: `Principal of ${formatMaloti(appOrLoan.amount)} has been released! Repayment is scheduled for ${appOrLoan.dueDate || '30 days'}.`,
        type: 'success',
        category: 'loan_status',
        actionUrl: 'portal:loans',
        metadata: {
          loanNumber: appOrLoan.number,
          amount: appOrLoan.amount,
          dueDate: appOrLoan.dueDate,
          priority: 'high',
        },
      };

    case 'settled':
      return {
        userId: studentId,
        title: `🏆 Loan #${appOrLoan.number} Fully Paid!`,
        message: `You have successfully cleared your loan! Your POKOLA student credit standing has been upgraded for future borrowing.`,
        type: 'success',
        category: 'loan_status',
        actionUrl: 'portal:loans',
        metadata: {
          loanNumber: appOrLoan.number,
        },
      };

    case 'overdue':
      return {
        userId: studentId,
        title: `🚨 Urgent: Loan #${appOrLoan.number} Overdue`,
        message: `Your repayment of ${formatMaloti(appOrLoan.amount)} was due on ${appOrLoan.dueDate}. Please make payment immediately via M-Pesa or EcoCash to prevent late penalties.`,
        type: 'alert',
        category: 'repayment_deadline',
        actionUrl: 'portal:repay',
        metadata: {
          loanNumber: appOrLoan.number,
          amount: appOrLoan.amount,
          dueDate: appOrLoan.dueDate,
          priority: 'urgent',
        },
      };
  }
}

/**
 * Construct Repayment Deadline Alert Push Notification
 */
export function createRepaymentDeadlineNotification(
  studentId: string,
  loan: Loan,
  daysRemaining: number
): PushNotificationPayload {
  const formattedBalance = formatMaloti(loan.balance);

  if (daysRemaining > 3) {
    return {
      userId: studentId,
      title: `📅 Repayment Due in ${daysRemaining} Days`,
      message: `Friendly reminder: Your POKOLA loan #${loan.loanNumber} settlement of ${formattedBalance} is due on ${loan.dueDate}. Easy payments via M-Pesa or EcoCash.`,
      type: 'info',
      category: 'repayment_deadline',
      actionUrl: 'portal:repay',
      metadata: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        amount: loan.balance,
        dueDate: loan.dueDate,
        daysRemaining,
        priority: 'normal',
      },
    };
  } else if (daysRemaining === 3 || daysRemaining === 2) {
    return {
      userId: studentId,
      title: `⏳ Payment Reminder: 3 Days Left (${loan.loanNumber})`,
      message: `Your balance of ${formattedBalance} for Loan #${loan.loanNumber} is due on ${loan.dueDate}. Avoid rush by settling early!`,
      type: 'warning',
      category: 'repayment_deadline',
      actionUrl: 'portal:repay',
      metadata: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        amount: loan.balance,
        dueDate: loan.dueDate,
        daysRemaining,
        priority: 'high',
      },
    };
  } else if (daysRemaining === 1) {
    return {
      userId: studentId,
      title: `⚠️ Payment Due Tomorrow! (${loan.loanNumber})`,
      message: `Urgent reminder: Your settlement of ${formattedBalance} is due tomorrow (${loan.dueDate}). Tap to pay via Vodacom M-Pesa or Econet EcoCash.`,
      type: 'warning',
      category: 'repayment_deadline',
      actionUrl: 'portal:repay',
      metadata: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        amount: loan.balance,
        dueDate: loan.dueDate,
        daysRemaining: 1,
        priority: 'urgent',
      },
    };
  } else if (daysRemaining === 0) {
    return {
      userId: studentId,
      title: `🚨 Payment Due Today: ${formattedBalance}`,
      message: `Your POKOLA loan repayment is due today (${loan.dueDate}). Please confirm your M-Pesa reference to complete today's settlement.`,
      type: 'alert',
      category: 'repayment_deadline',
      actionUrl: 'portal:repay',
      metadata: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        amount: loan.balance,
        dueDate: loan.dueDate,
        daysRemaining: 0,
        priority: 'urgent',
      },
    };
  } else {
    const overdueDays = Math.abs(daysRemaining);
    return {
      userId: studentId,
      title: `🚨 Overdue Notice: ${overdueDays} Days Past Due`,
      message: `Loan #${loan.loanNumber} is ${overdueDays} days past its due date (${loan.dueDate}). Current balance: ${formattedBalance}. Please settle immediately to avoid credit flag.`,
      type: 'alert',
      category: 'repayment_deadline',
      actionUrl: 'portal:repay',
      metadata: {
        loanId: loan.id,
        loanNumber: loan.loanNumber,
        amount: loan.balance,
        dueDate: loan.dueDate,
        daysRemaining,
        priority: 'urgent',
      },
    };
  }
}

/**
 * Construct Administrative Announcement Push Notification
 */
export function createAnnouncementNotification(
  studentId: string,
  announcement: AnnouncementItem
): PushNotificationPayload {
  const priorityPrefix = announcement.priority === 'urgent' ? '🚨 [URGENT] ' : announcement.priority === 'high' ? '📢 [IMPORTANT] ' : '📢 ';
  return {
    userId: studentId,
    title: `${priorityPrefix}${announcement.title}`,
    message: announcement.body,
    type: announcement.priority === 'urgent' ? 'alert' : announcement.priority === 'high' ? 'warning' : 'info',
    category: 'announcement',
    actionUrl: 'portal:announcements',
    metadata: {
      announcementId: announcement.id,
      priority: announcement.priority,
    },
  };
}

/**
 * Dispatch Push Notification helper
 */
export function dispatchPushNotification(
  payload: PushNotificationPayload,
  soundEnabled = true
): NotificationItem {
  const fcmMessageId = `fcm_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const notifItem: NotificationItem = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: payload.userId,
    title: payload.title,
    message: payload.message,
    type: payload.type,
    category: payload.category,
    isRead: false,
    createdAt: new Date().toISOString(),
    actionUrl: payload.actionUrl,
    fcmMessageId,
    metadata: payload.metadata,
  };

  // Play audio chime if configured
  if (soundEnabled) {
    playNotificationChime(payload.type);
  }

  // Dispatch native browser notification
  showNativeBrowserNotification(payload.title, {
    body: payload.message,
    tag: payload.category,
    data: payload.metadata,
  });

  return notifItem;
}
