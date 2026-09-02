import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  UserProfile, 
  LoanApplication, 
  Loan, 
  Repayment, 
  BusinessSettings, 
  AuditLog, 
  NotificationItem, 
  SupportTicket,
  RepaymentScheduleItem,
  AnnouncementItem,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementTargetAudience,
  PushNotificationPreferences,
  FCMDeviceToken,
  NotificationCategory
} from '../types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_STAFF, 
  INITIAL_APPLICATIONS, 
  INITIAL_LOANS, 
  INITIAL_REPAYMENTS, 
  INITIAL_BUSINESS_SETTINGS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ANNOUNCEMENTS,
  INITIAL_SUPPORT_TICKETS 
} from '../data/mockData';
import { calculateLoan, calculateRiskScore, evaluateEligibility, roundMoney, formatMaloti } from '../utils/loanEngine';
import { 
  requestFCMToken, 
  registerForegroundPushListener, 
  playNotificationChime 
} from '../lib/fcm';
import { 
  createLoanStatusNotification, 
  createRepaymentDeadlineNotification, 
  createAnnouncementNotification, 
  dispatchPushNotification,
  PushNotificationPayload 
} from '../lib/notificationService';

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  allUsers: UserProfile[];
  applications: LoanApplication[];
  loans: Loan[];
  repayments: Repayment[];
  settings: BusinessSettings;
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  announcements: AnnouncementItem[];
  fcmTokens: FCMDeviceToken[];
  pushPreferences: PushNotificationPreferences;
  supportTickets: SupportTicket[];
  
  // Actions
  registerStudent: (data: Partial<UserProfile>) => { success: boolean; message: string; user?: UserProfile };
  updateUserProfile: (userId: string, updates: Partial<UserProfile>) => void;
  submitLoanApplication: (amount: number, purpose: string, repaymentModel?: 'one_month' | 'bi_weekly' | 'custom') => { success: boolean; message: string; application?: LoanApplication };
  reviewApplication: (appId: string, decision: 'approved' | 'rejected' | 'under_review', reasonOrNotes?: string) => void;
  acceptLoanAgreement: (appId: string, agreementData: { acknowledgedTerms: boolean; legalName: string }) => { success: boolean; message: string; loan?: Loan };
  recordRepayment: (data: {
    loanId: string;
    amount: number;
    paymentMethod: 'mpesa' | 'ecocash' | 'bank_transfer' | 'cash' | 'other';
    transactionReference: string;
    notes?: string;
  }) => { success: boolean; message: string; receipt?: Repayment };
  updateLoanStatus: (loanId: string, newStatus: 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'defaulted', reason?: string) => { success: boolean; message: string };
  updateBusinessSettings: (newSettings: BusinessSettings) => { success: boolean; message: string };
  triggerPaymentReminders: () => { sentCount: number; message: string };
  broadcastAnnouncement: (data: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    priority: AnnouncementPriority;
    targetAudience: AnnouncementTargetAudience;
    targetCampus?: string;
  }) => { success: boolean; message: string; announcement?: AnnouncementItem };
  deleteAnnouncement: (id: string) => void;
  requestPushPermission: () => Promise<boolean>;
  updatePushPreferences: (updates: Partial<PushNotificationPreferences>) => void;
  simulateTestPushNotification: (type: 'loan_approval' | 'repayment_due' | 'announcement' | 'overdue') => void;
  createSupportTicket: (subject: string, category: any, message: string) => void;
  replyToSupportTicket: (ticketId: string, message: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;
  resetDemoData: () => void;
  exportCSV: (type: 'loans' | 'applications' | 'repayments' | 'audit') => void;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  isOnline: boolean;
  isOfflinePersistenceEnabled: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'pokola_users_v1',
  CURRENT_USER_ID: 'pokola_cur_uid_v1',
  APPLICATIONS: 'pokola_apps_v1',
  LOANS: 'pokola_loans_v1',
  REPAYMENTS: 'pokola_reps_v1',
  SETTINGS: 'pokola_settings_v1',
  AUDIT_LOGS: 'pokola_audit_v1',
  NOTIFICATIONS: 'pokola_notifs_v1',
  ANNOUNCEMENTS: 'pokola_announcements_v1',
  FCM_TOKENS: 'pokola_fcm_tokens_v1',
  PUSH_PREFERENCES: 'pokola_push_prefs_v1',
  SUPPORT: 'pokola_tickets_v1',
  DARK_MODE: 'pokola_dark_mode_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with localStorage fallback
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      return stored ? JSON.parse(stored) : [...INITIAL_STAFF, ...INITIAL_STUDENTS];
    } catch {
      return [...INITIAL_STAFF, ...INITIAL_STUDENTS];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const storedUid = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedUid) {
        const found = allUsers.find((u) => u.id === storedUid);
        if (found) return found;
      }
      // Default to first student for easy demonstration
      return INITIAL_STUDENTS[0];
    } catch {
      return INITIAL_STUDENTS[0];
    }
  });

  const [applications, setApplications] = useState<LoanApplication[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_APPLICATIONS;
    } catch {
      return INITIAL_APPLICATIONS;
    }
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.LOANS);
      return stored ? JSON.parse(stored) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [repayments, setRepayments] = useState<Repayment[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REPAYMENTS);
      return stored ? JSON.parse(stored) : INITIAL_REPAYMENTS;
    } catch {
      return INITIAL_REPAYMENTS;
    }
  });

  const [settings, setSettings] = useState<BusinessSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return stored ? JSON.parse(stored) : INITIAL_BUSINESS_SETTINGS;
    } catch {
      return INITIAL_BUSINESS_SETTINGS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return stored ? JSON.parse(stored) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      return stored ? JSON.parse(stored) : INITIAL_ANNOUNCEMENTS;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  });

  const [fcmTokens, setFcmTokens] = useState<FCMDeviceToken[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FCM_TOKENS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [pushPreferences, setPushPreferences] = useState<PushNotificationPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PUSH_PREFERENCES);
      if (stored) return JSON.parse(stored);
      const isGranted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
      return {
        pushEnabled: true,
        soundEnabled: true,
        loanStatusAlerts: true,
        repaymentReminders: true,
        announcementsAlerts: true,
        fcmToken: typeof localStorage !== 'undefined' ? localStorage.getItem('pokola_active_fcm_token') : null,
        permissionStatus: typeof Notification !== 'undefined' ? (Notification.permission as any) : 'default',
      };
    } catch {
      return {
        pushEnabled: true,
        soundEnabled: true,
        loanStatusAlerts: true,
        repaymentReminders: true,
        announcementsAlerts: true,
        fcmToken: null,
        permissionStatus: 'default',
      };
    }
  });

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SUPPORT);
      return stored ? JSON.parse(stored) : INITIAL_SUPPORT_TICKETS;
    } catch {
      return INITIAL_SUPPORT_TICKETS;
    }
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const isOfflinePersistenceEnabled = true;

  // Dark Mode State with LocalStorage Persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
      return stored !== null ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(nextVal));
      } catch (e) { console.error(e); }
      return nextVal;
    });
  };

  const setDarkMode = (val: boolean) => {
    setIsDarkMode(val);
    try {
      localStorage.setItem(STORAGE_KEYS.DARK_MODE, JSON.stringify(val));
    } catch (e) { console.error(e); }
  };

  // Register foreground FCM push listener on mount
  useEffect(() => {
    registerForegroundPushListener((payload) => {
      if (currentUser) {
        const notif: NotificationItem = {
          id: `notif_fcm_${Date.now()}`,
          userId: currentUser.id,
          title: payload.title,
          message: payload.body,
          type: 'info',
          category: payload.data?.category || 'loan_status',
          isRead: false,
          createdAt: new Date().toISOString(),
          metadata: payload.data,
        };
        setNotifications((prev) => [notif, ...prev]);
        if (pushPreferences.soundEnabled) {
          playNotificationChime('info');
        }
        showToast(`Push Alert: ${payload.title}`, 'info');
      }
    });
  }, [currentUser, pushPreferences.soundEnabled]);

  // Listen to network changes (online/offline events for intermittent connectivity in Lesotho)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connected: Online sync active with Cloud Firestore', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline Mode: Using cached loan data & offline persistence', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(allUsers));
    } catch (e) { console.error(e); }
  }, [allUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      }
    } catch (e) { console.error(e); }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    } catch (e) { console.error(e); }
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    } catch (e) { console.error(e); }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REPAYMENTS, JSON.stringify(repayments));
    } catch (e) { console.error(e); }
  }, [repayments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) { console.error(e); }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch (e) { console.error(e); }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (e) { console.error(e); }
  }, [notifications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) { console.error(e); }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FCM_TOKENS, JSON.stringify(fcmTokens));
    } catch (e) { console.error(e); }
  }, [fcmTokens]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PUSH_PREFERENCES, JSON.stringify(pushPreferences));
    } catch (e) { console.error(e); }
  }, [pushPreferences]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPPORT, JSON.stringify(supportTickets));
    } catch (e) { console.error(e); }
  }, [supportTickets]);

  // Subscribe to real-time audit logs from Firestore
  useEffect(() => {
    try {
      const auditLogsRef = collection(db, 'auditLogs');
      const q = query(auditLogsRef, orderBy('timestamp', 'desc'), limit(150));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const firestoreLogs: AuditLog[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                timestamp: data.timestamp || new Date().toISOString(),
                userId: data.userId || 'sys',
                userName: data.userName || 'Unknown',
                userRole: data.userRole || 'student',
                action: data.action || 'ACTION',
                affectedRecordType: data.affectedRecordType || 'SYSTEM',
                affectedRecordId: data.affectedRecordId || 'N/A',
                previousValue: data.previousValue,
                newValue: data.newValue,
                ipAddress: data.ipAddress,
                details: data.details || '',
              };
            });

            setAuditLogs((prev) => {
              const existingIds = new Set(firestoreLogs.map((l) => l.id));
              const localOnly = prev.filter((l) => !existingIds.has(l.id));
              const combined = [...firestoreLogs, ...localOnly];
              combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
              return combined;
            });
          }
        },
        (error) => {
          console.warn('Firestore auditLogs subscription notice:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('Failed to initialize Firestore auditLogs subscription:', err);
    }
  }, []);

  // Helper to add audit log
  const logAudit = async (
    action: string,
    affectedRecordType: AuditLog['affectedRecordType'],
    affectedRecordId: string,
    details: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const timestamp = new Date().toISOString();
    const newLog: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      userId: currentUser?.id || 'sys',
      userName: currentUser?.fullName || 'System Event',
      userRole: currentUser?.role || 'student',
      action,
      affectedRecordType,
      affectedRecordId,
      previousValue,
      newValue,
      ipAddress: '197.231.144.10 (Lesotho Telecom Gateway)',
      details,
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    try {
      const auditCollectionRef = collection(db, 'auditLogs');
      await addDoc(auditCollectionRef, {
        timestamp: newLog.timestamp,
        userId: newLog.userId,
        userName: newLog.userName,
        userRole: newLog.userRole,
        action: newLog.action,
        affectedRecordType: newLog.affectedRecordType,
        affectedRecordId: newLog.affectedRecordId,
        previousValue: newLog.previousValue || null,
        newValue: newLog.newValue || null,
        ipAddress: newLog.ipAddress || '197.231.144.10 (Lesotho Telecom Gateway)',
        details: newLog.details,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Audit log write to Firestore logged locally (offline / rule fallback):', err);
    }
  };

  // Helper to add notification with push dispatch & audio feedback
  const addNotification = (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' = 'info',
    category: NotificationCategory = 'system',
    metadata?: any,
    actionUrl?: string
  ) => {
    const notifItem = dispatchPushNotification(
      {
        userId,
        title,
        message,
        type,
        category,
        actionUrl,
        metadata,
      },
      pushPreferences.soundEnabled && pushPreferences.pushEnabled
    );

    setNotifications((prev) => [notifItem, ...prev]);
  };

  // Request Push Permission and Register FCM Device Token
  const requestPushPermission = async (): Promise<boolean> => {
    if (!currentUser) return false;

    const result = await requestFCMToken(currentUser.id, currentUser.fullName);
    if (result.success && result.deviceToken) {
      setFcmTokens((prev) => {
        const filtered = prev.filter((t) => t.userId !== currentUser.id);
        return [result.deviceToken!, ...filtered];
      });

      setPushPreferences((prev) => ({
        ...prev,
        pushEnabled: true,
        permissionStatus: result.status,
        fcmToken: result.token,
      }));

      logAudit(
        'FCM_DEVICE_REGISTERED',
        'SYSTEM',
        result.deviceToken.id,
        `Device push token registered for ${currentUser.fullName} (${result.deviceToken.deviceType})`
      );

      showToast('Push notifications successfully enabled for this device!', 'success');
      return true;
    } else {
      setPushPreferences((prev) => ({
        ...prev,
        permissionStatus: result.status,
      }));

      if (result.status === 'denied') {
        showToast('Push permission was blocked. Please enable notifications in your browser settings.', 'error');
      } else if (result.message) {
        showToast(result.message, 'info');
      }
      return false;
    }
  };

  // Update Push Preferences
  const updatePushPreferences = (updates: Partial<PushNotificationPreferences>) => {
    setPushPreferences((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.PUSH_PREFERENCES, JSON.stringify(next));
      } catch (e) { console.error(e); }
      return next;
    });
    showToast('Notification preferences updated!', 'success');
  };

  // Broadcast Announcement via FCM & In-App
  const broadcastAnnouncement = (data: {
    title: string;
    body: string;
    category: AnnouncementCategory;
    priority: AnnouncementPriority;
    targetAudience: AnnouncementTargetAudience;
    targetCampus?: string;
  }) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin' && currentUser.role !== 'loan_officer')) {
      return { success: false, message: 'Unauthorized. Officer or Admin credentials required.' };
    }

    if (!data.title.trim() || !data.body.trim()) {
      return { success: false, message: 'Announcement title and content are required.' };
    }

    const newAnnouncement: AnnouncementItem = {
      id: `anc_${Date.now()}`,
      title: data.title.trim(),
      body: data.body.trim(),
      category: data.category,
      priority: data.priority,
      targetAudience: data.targetAudience,
      targetCampus: data.targetCampus,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      sentViaFCM: true,
      createdAt: new Date().toISOString(),
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    // Target student recipients based on audience filters
    let targetStudents = allUsers.filter((u) => u.role === 'student');

    if (data.targetAudience === 'active_borrowers') {
      const activeBorrowerIds = new Set(loans.filter((l) => l.status === 'active' || l.status === 'partially_paid').map((l) => l.studentId));
      targetStudents = targetStudents.filter((s) => activeBorrowerIds.has(s.id));
    } else if (data.targetAudience === 'overdue') {
      const overdueBorrowerIds = new Set(loans.filter((l) => l.status === 'overdue').map((l) => l.studentId));
      targetStudents = targetStudents.filter((s) => overdueBorrowerIds.has(s.id));
    } else if (data.targetAudience === 'specific_campus' && data.targetCampus) {
      targetStudents = targetStudents.filter((s) => s.institution.toLowerCase().includes(data.targetCampus!.toLowerCase()));
    }

    // Send push notification to all targeted students
    targetStudents.forEach((student) => {
      const payload = createAnnouncementNotification(student.id, newAnnouncement);
      addNotification(
        student.id,
        payload.title,
        payload.message,
        payload.type,
        payload.category,
        payload.metadata,
        payload.actionUrl
      );
    });

    logAudit(
      'ANNOUNCEMENT_BROADCASTED',
      'SYSTEM',
      newAnnouncement.id,
      `Broadcasted announcement "${newAnnouncement.title}" to ${targetStudents.length} students via FCM & In-App.`
    );

    showToast(`Announcement broadcasted to ${targetStudents.length} students via Firebase Cloud Messaging!`, 'success');
    return { success: true, message: 'Announcement broadcasted successfully', announcement: newAnnouncement };
  };

  // Delete Announcement
  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    showToast('Announcement removed', 'info');
  };

  // Simulate Instant Test Push Notification for Student
  const simulateTestPushNotification = (type: 'loan_approval' | 'repayment_due' | 'announcement' | 'overdue') => {
    if (!currentUser) return;

    let payload: PushNotificationPayload;

    if (type === 'loan_approval') {
      payload = createLoanStatusNotification(currentUser.id, 'approved', {
        number: 'APP-2026-0188',
        amount: 950,
      });
    } else if (type === 'repayment_due') {
      const activeLoan = loans.find((l) => l.studentId === currentUser.id) || loans[0];
      payload = createRepaymentDeadlineNotification(currentUser.id, activeLoan, 3);
    } else if (type === 'overdue') {
      const activeLoan = loans.find((l) => l.studentId === currentUser.id) || loans[0];
      payload = createRepaymentDeadlineNotification(currentUser.id, activeLoan, -4);
    } else {
      const demoAnnouncement: AnnouncementItem = announcements[0] || INITIAL_ANNOUNCEMENTS[0];
      payload = createAnnouncementNotification(currentUser.id, demoAnnouncement);
    }

    const notifItem = dispatchPushNotification(payload, pushPreferences.soundEnabled);
    setNotifications((prev) => [notifItem, ...prev]);

    showToast(`Test FCM Push Delivered: "${payload.title}"`, 'info');
  };

  // Clear all notifications for current user
  const clearAllNotifications = () => {
    if (!currentUser) return;
    setNotifications((prev) => prev.filter((n) => n.userId !== currentUser.id));
    showToast('Notifications cleared', 'info');
  };

  // Register Student
  const registerStudent = (data: Partial<UserProfile>) => {
    if (!data.fullName || !data.email || !data.studentIdNumber || !data.institution) {
      return { success: false, message: 'Please fill in all mandatory fields (Full Name, Email, Student ID, Institution).' };
    }

    // Check duplicate email
    if (allUsers.some((u) => u.email.toLowerCase() === data.email?.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists. Please log in.' };
    }

    const newStudent: UserProfile = {
      id: `usr_std_${Date.now().toString().slice(-6)}`,
      email: data.email,
      fullName: data.fullName,
      role: 'student',
      phone: data.phone || '+266 5800 0000',
      dateOfBirth: data.dateOfBirth || '2004-01-01',
      studentIdNumber: data.studentIdNumber,
      institution: data.institution,
      faculty: data.faculty || 'General Studies',
      yearOfStudy: Number(data.yearOfStudy) || 1,
      residentialAddress: data.residentialAddress || 'Maseru, Lesotho',
      emergencyContactName: data.emergencyContactName || 'Parent/Guardian',
      emergencyContactPhone: data.emergencyContactPhone || '+266 5800 0000',
      emergencyContactRelation: data.emergencyContactRelation || 'Parent',
      preferredRepaymentMethod: data.preferredRepaymentMethod || 'mpesa',
      isVerified: true, // Default verified in demo mode for instant usability
      documentsUploaded: data.documentsUploaded || { studentIdCard: 'student_id_card.pdf' },
      createdAt: new Date().toISOString(),
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?w=150&auto=format&fit=crop&q=80`,
    };

    setAllUsers((prev) => [...prev, newStudent]);
    setCurrentUser(newStudent);
    logAudit('USER_REGISTERED', 'USER', newStudent.id, `New student registered: ${newStudent.fullName} (${newStudent.studentIdNumber})`);
    addNotification(newStudent.id, 'Welcome to POKOLA', 'Your student loan account is ready! Complete your eligibility check to apply for small short-term loans.', 'success');
    showToast(`Welcome, ${newStudent.fullName}! Your account has been registered.`, 'success');

    return { success: true, message: 'Registration successful', user: newStudent };
  };

  // Update Profile
  const updateUserProfile = (userId: string, updates: Partial<UserProfile>) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));
    }
    logAudit('USER_PROFILE_UPDATED', 'USER', userId, `Profile updated for user ${userId}`);
    showToast('Profile updated successfully!', 'success');
  };

  // Submit Loan Application
  const submitLoanApplication = (
    amount: number,
    purpose: string,
    repaymentModel: 'one_month' | 'bi_weekly' | 'custom' = 'one_month'
  ) => {
    if (!currentUser || currentUser.role !== 'student') {
      return { success: false, message: 'Only authenticated students can submit a loan application.' };
    }

    // Eligibility check
    const eligibility = evaluateEligibility(currentUser, loans, amount, settings);
    if (!eligibility.isEligible) {
      return { 
        success: false, 
        message: `Eligibility check not passed: ${eligibility.reason || 'Please verify profile requirements.'}` 
      };
    }

    const calc = calculateLoan(amount, settings.monthlyInterestRate, settings.defaultRepaymentPeriodDays, repaymentModel);
    const studentLoans = loans.filter((l) => l.studentId === currentUser.id);
    const riskEval = calculateRiskScore(currentUser, studentLoans, amount, settings);

    const appNumber = `APP-2026-${(applications.length + 101).toString().padStart(4, '0')}`;
    const newApp: LoanApplication = {
      id: `app_${Date.now()}`,
      applicationNumber: appNumber,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      studentEmail: currentUser.email,
      studentPhone: currentUser.phone,
      institution: currentUser.institution,
      studentIdNumber: currentUser.studentIdNumber,
      requestedAmount: roundMoney(amount),
      purpose: purpose || 'Academic & living expenses',
      monthlyInterestRate: settings.monthlyInterestRate,
      calculatedInterest: calc.interestAmount,
      totalRepayment: calc.totalRepayment,
      repaymentPeriodDays: settings.defaultRepaymentPeriodDays,
      repaymentModel,
      status: 'submitted',
      riskEvaluation: riskEval,
      appliedAt: new Date().toISOString(),
    };

    setApplications((prev) => [newApp, ...prev]);

    logAudit(
      'LOAN_APPLICATION_SUBMITTED',
      'APPLICATION',
      newApp.id,
      `Submitted ${appNumber} for ${formatMaloti(amount)}. Calculated interest: ${formatMaloti(calc.interestAmount)}. Total: ${formatMaloti(calc.totalRepayment)}`,
      undefined,
      `Requested: ${formatMaloti(amount)} | Risk: ${riskEval.riskLevel}`
    );

    addNotification(
      currentUser.id,
      'Loan Application Submitted',
      `Your loan application ${appNumber} for ${formatMaloti(amount)} has been submitted and is under review.`,
      'info'
    );

    // Notify staff
    INITIAL_STAFF.forEach((staff) => {
      addNotification(
        staff.id,
        'New Loan Application',
        `New application ${appNumber} from ${currentUser.fullName} (${formatMaloti(amount)}) pending review.`,
        'info'
      );
    });

    showToast(`Application ${appNumber} submitted successfully!`, 'success');
    return { success: true, message: 'Application submitted', application: newApp };
  };

  // Review Application (Approve / Reject / Under Review)
  const reviewApplication = (
    appId: string,
    decision: 'approved' | 'rejected' | 'under_review',
    reasonOrNotes?: string
  ) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'loan_officer' && currentUser.role !== 'super_admin')) {
      showToast('Unauthorized. Only Loan Officers and Administrators can review applications.', 'error');
      return;
    }

    const appToReview = applications.find((a) => a.id === appId);
    if (!appToReview) {
      showToast('Application not found', 'error');
      return;
    }

    const prevStatus = appToReview.status;
    const reviewerName = currentUser.fullName;

    const updatedApps = applications.map((a) => {
      if (a.id === appId) {
        return {
          ...a,
          status: decision,
          reviewedAt: new Date().toISOString(),
          reviewedBy: currentUser.id,
          reviewerName,
          approvedAt: decision === 'approved' ? new Date().toISOString() : a.approvedAt,
          rejectionReason: decision === 'rejected' ? reasonOrNotes : undefined,
          officerNotes: reasonOrNotes,
        };
      }
      return a;
    });

    setApplications(updatedApps);

    logAudit(
      `LOAN_APPLICATION_${decision.toUpperCase()}`,
      'APPLICATION',
      appId,
      `Application ${appToReview.applicationNumber} status changed from ${prevStatus} to ${decision} by ${reviewerName}. Notes: ${reasonOrNotes || 'N/A'}`,
      prevStatus,
      decision
    );

    if (decision === 'approved') {
      addNotification(
        appToReview.studentId,
        'Loan Application Approved!',
        `Your application ${appToReview.applicationNumber} for ${formatMaloti(appToReview.requestedAmount)} has been APPROVED! Please review and sign your digital loan agreement to activate the loan.`,
        'success'
      );
      showToast(`Application ${appToReview.applicationNumber} Approved!`, 'success');
    } else if (decision === 'rejected') {
      addNotification(
        appToReview.studentId,
        'Loan Application Update',
        `Your application ${appToReview.applicationNumber} was not approved. Reason: ${reasonOrNotes || 'Credit policy requirements not met.'}`,
        'warning'
      );
      showToast(`Application ${appToReview.applicationNumber} Rejected.`, 'info');
    } else {
      addNotification(
        appToReview.studentId,
        'Application Under Review',
        `Your application ${appToReview.applicationNumber} is being processed. Officer Note: ${reasonOrNotes || 'Verification in progress.'}`,
        'info'
      );
      showToast(`Application marked Under Review.`, 'info');
    }
  };

  // Student Accepts Digital Loan Agreement -> Activates Loan
  const acceptLoanAgreement = (
    appId: string,
    agreementData: { acknowledgedTerms: boolean; legalName: string }
  ) => {
    if (!currentUser) return { success: false, message: 'Authentication required' };

    const targetApp = applications.find((a) => a.id === appId);
    if (!targetApp || targetApp.status !== 'approved') {
      return { success: false, message: 'Application is not in approved state.' };
    }

    const calc = calculateLoan(
      targetApp.requestedAmount,
      targetApp.monthlyInterestRate,
      targetApp.repaymentPeriodDays,
      targetApp.repaymentModel
    );

    const loanNumber = `PKL-2026-${(loans.length + 80).toString().padStart(4, '0')}`;
    const acceptanceRef = `AGR-PKL-${Date.now().toString().slice(-4)}-${targetApp.studentName.toUpperCase().replace(/\s+/g, '')}`;

    const newLoan: Loan = {
      id: `ln_${Date.now()}`,
      loanNumber,
      applicationId: targetApp.id,
      studentId: targetApp.studentId,
      studentName: targetApp.studentName,
      studentEmail: targetApp.studentEmail,
      studentPhone: targetApp.studentPhone,
      institution: targetApp.institution,
      studentIdNumber: targetApp.studentIdNumber,
      principal: calc.principal,
      monthlyInterestRate: calc.monthlyInterestRate,
      interestAmount: calc.interestAmount,
      totalRepayable: calc.totalRepayment,
      amountPaid: 0,
      balance: calc.totalRepayment,
      status: 'active',
      disbursedAt: new Date().toISOString(),
      dueDate: calc.dueDate,
      repaymentPeriodDays: calc.repaymentPeriodDays,
      lateFeeAccrued: 0,
      schedule: calc.schedule,
      agreementSignature: {
        acceptedAt: new Date().toISOString(),
        ipAddress: '197.231.144.12',
        acknowledgedTerms: agreementData.acknowledgedTerms,
        legalName: agreementData.legalName || targetApp.studentName,
        deviceInfo: navigator.userAgent.substring(0, 50),
        acceptanceReference: acceptanceRef,
      },
    };

    // Update application status to accepted/active
    setApplications((prev) =>
      prev.map((a) =>
        a.id === appId ? { ...a, status: 'active', acceptedAt: new Date().toISOString() } : a
      )
    );

    // Add new active loan
    setLoans((prev) => [newLoan, ...prev]);

    logAudit(
      'LOAN_AGREEMENT_ACCEPTED',
      'AGREEMENT',
      newLoan.id,
      `Student ${targetApp.studentName} accepted digital loan terms for ${loanNumber}. Reference: ${acceptanceRef}`,
      'APPROVED',
      'ACTIVE'
    );

    addNotification(
      targetApp.studentId,
      'Loan Disbursed & Active',
      `Your loan ${loanNumber} of ${formatMaloti(calc.principal)} has been activated! Repayment of ${formatMaloti(calc.totalRepayment)} is due on ${calc.dueDate}.`,
      'success'
    );

    showToast(`Loan ${loanNumber} activated successfully!`, 'success');
    return { success: true, message: 'Loan activated', loan: newLoan };
  };

  // Record Repayment (Student self-record or Admin/Officer record)
  const recordRepayment = (data: {
    loanId: string;
    amount: number;
    paymentMethod: 'mpesa' | 'ecocash' | 'bank_transfer' | 'cash' | 'other';
    transactionReference: string;
    notes?: string;
  }) => {
    const targetLoan = loans.find((l) => l.id === data.loanId);
    if (!targetLoan) {
      return { success: false, message: 'Loan not found' };
    }

    const payAmount = roundMoney(Number(data.amount));
    if (isNaN(payAmount) || payAmount <= 0) {
      return { success: false, message: 'Please enter a valid payment amount greater than 0.' };
    }

    if (!data.transactionReference || data.transactionReference.trim().length < 3) {
      return { success: false, message: 'A valid transaction reference / receipt code is required.' };
    }

    const previousBalance = targetLoan.balance;
    const newAmountPaid = roundMoney(targetLoan.amountPaid + payAmount);
    const newBalance = roundMoney(Math.max(0, targetLoan.totalRepayable - newAmountPaid));
    
    let newStatus = targetLoan.status;
    if (newBalance === 0) {
      newStatus = 'fully_paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partially_paid';
    }

    // Update schedule installments
    let remainingPaymentToAllocate = payAmount;
    const updatedSchedule: RepaymentScheduleItem[] = targetLoan.schedule.map((inst) => {
      if (remainingPaymentToAllocate <= 0) return inst;

      const unpaidInThisInst = roundMoney(inst.expectedAmount - inst.amountPaid);
      if (unpaidInThisInst <= 0) return inst;

      const allocation = Math.min(unpaidInThisInst, remainingPaymentToAllocate);
      remainingPaymentToAllocate = roundMoney(remainingPaymentToAllocate - allocation);
      const updatedPaid = roundMoney(inst.amountPaid + allocation);
      const updatedRemaining = roundMoney(inst.expectedAmount - updatedPaid);

      return {
        ...inst,
        amountPaid: updatedPaid,
        remainingAmount: updatedRemaining,
        status: updatedRemaining === 0 ? 'paid' : 'partially_paid',
        paidDate: updatedRemaining === 0 ? new Date().toISOString().split('T')[0] : inst.paidDate,
      };
    });

    const receiptNumber = `RCP-2026-${(repayments.length + 8801).toString()}`;
    const newRepayment: Repayment = {
      id: `rep_${Date.now()}`,
      receiptNumber,
      loanId: targetLoan.id,
      loanNumber: targetLoan.loanNumber,
      studentId: targetLoan.studentId,
      studentName: targetLoan.studentName,
      amount: payAmount,
      date: new Date().toISOString(),
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference.trim(),
      recordedBy: currentUser?.id || 'sys',
      recordedByName: currentUser?.fullName || 'POKOLA System',
      notes: data.notes,
      status: 'confirmed',
    };

    // Update loans list
    setLoans((prev) =>
      prev.map((l) =>
        l.id === data.loanId
          ? {
              ...l,
              amountPaid: newAmountPaid,
              balance: newBalance,
              status: newStatus,
              schedule: updatedSchedule,
              lastPaymentDate: new Date().toISOString().split('T')[0],
              closedAt: newStatus === 'fully_paid' ? new Date().toISOString() : l.closedAt,
            }
          : l
      )
    );

    setRepayments((prev) => [newRepayment, ...prev]);

    logAudit(
      'REPAYMENT_RECORDED',
      'REPAYMENT',
      newRepayment.id,
      `Payment of ${formatMaloti(payAmount)} via ${data.paymentMethod.toUpperCase()} (Ref: ${data.transactionReference}) against ${targetLoan.loanNumber}. Balance: ${formatMaloti(previousBalance)} -> ${formatMaloti(newBalance)}`,
      `Balance: ${formatMaloti(previousBalance)}`,
      `Balance: ${formatMaloti(newBalance)} | Status: ${newStatus}`
    );

    addNotification(
      targetLoan.studentId,
      `Payment Confirmed: ${formatMaloti(payAmount)}`,
      `Your payment of ${formatMaloti(payAmount)} (${receiptNumber}) has been recorded. Outstanding balance: ${formatMaloti(newBalance)}.`,
      newStatus === 'fully_paid' ? 'success' : 'info'
    );

    if (newStatus === 'fully_paid') {
      addNotification(
        targetLoan.studentId,
        'Congratulations! Loan Fully Settled',
        `You have fully settled Loan #${targetLoan.loanNumber}! Your positive repayment performance has increased your credit rating on POKOLA.`,
        'success'
      );
    }

    showToast(`Payment of ${formatMaloti(payAmount)} recorded successfully!`, 'success');
    return { success: true, message: 'Repayment recorded', receipt: newRepayment };
  };

  // Update Loan Status (e.g., mark Overdue, Defaulted, Active) by Officer/Admin
  const updateLoanStatus = (
    loanId: string,
    newStatus: 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'defaulted',
    reason?: string
  ) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'loan_officer' && currentUser.role !== 'super_admin')) {
      return { success: false, message: 'Unauthorized. Officer or Admin credentials required.' };
    }

    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) {
      return { success: false, message: 'Loan record not found.' };
    }

    const prevStatus = targetLoan.status;
    if (prevStatus === newStatus) {
      return { success: false, message: `Loan is already marked as ${newStatus}.` };
    }

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: newStatus,
              closedAt: newStatus === 'fully_paid' ? new Date().toISOString() : l.closedAt,
            }
          : l
      )
    );

    logAudit(
      'LOAN_STATUS_UPDATED',
      'LOAN',
      targetLoan.id,
      `Loan #${targetLoan.loanNumber} status manually transitioned from ${prevStatus.toUpperCase()} to ${newStatus.toUpperCase()} by ${currentUser.fullName}. Reason: ${reason || 'Officer status override'}`,
      `Status: ${prevStatus}`,
      `Status: ${newStatus}`
    );

    addNotification(
      targetLoan.studentId,
      `Loan Status Updated: ${newStatus.replace('_', ' ').toUpperCase()}`,
      `The status of your loan #${targetLoan.loanNumber} has been updated to ${newStatus.replace('_', ' ')}. ${reason ? `Note: ${reason}` : ''}`,
      newStatus === 'overdue' || newStatus === 'defaulted' ? 'alert' : 'info'
    );

    showToast(`Loan #${targetLoan.loanNumber} status updated to ${newStatus}!`, 'success');
    return { success: true, message: 'Loan status updated successfully' };
  };

  // Update Settings (Admin Only)
  const updateBusinessSettings = (newSettings: BusinessSettings) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
      return { success: false, message: 'Unauthorized. Only Administrators can modify lending configuration.' };
    }

    if (newSettings.maxLoanAmount <= 0 || newSettings.minLoanAmount < 0) {
      return { success: false, message: 'Loan amounts must be positive numbers.' };
    }

    if (newSettings.monthlyInterestRate < 0 || newSettings.monthlyInterestRate > 1.0) {
      return { success: false, message: 'Monthly interest rate must be between 0% and 100%.' };
    }

    const prevJson = JSON.stringify(settings);
    setSettings(newSettings);

    logAudit(
      'SETTINGS_UPDATED',
      'SETTINGS',
      'global',
      `Business lending configuration modified by ${currentUser.fullName}`,
      prevJson,
      JSON.stringify(newSettings)
    );

    showToast('Lending settings updated and applied platform-wide!', 'success');
    return { success: true, message: 'Settings saved' };
  };

  // Trigger automated payment reminder batch via FCM & In-App
  const triggerPaymentReminders = () => {
    let sentCount = 0;
    const now = new Date();

    loans.filter((l) => l.status === 'active' || l.status === 'partially_paid' || l.status === 'overdue').forEach((loan) => {
      const dueDate = new Date(loan.dueDate);
      const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if ([7, 3, 2, 1, 0].includes(diffDays) || diffDays < 0) {
        const payload = createRepaymentDeadlineNotification(loan.studentId, loan, diffDays);
        addNotification(
          loan.studentId,
          payload.title,
          payload.message,
          payload.type,
          payload.category,
          payload.metadata,
          payload.actionUrl
        );
        sentCount++;
      }
    });

    logAudit('AUTOMATED_REMINDERS_TRIGGERED', 'SYSTEM', 'reminders_batch', `Dispatched ${sentCount} automated FCM payment notifications across active student loans`);
    showToast(`Dispatched ${sentCount} payment reminders via Firebase Cloud Messaging!`, 'success');
    return { sentCount, message: `Sent ${sentCount} reminders` };
  };

  // Support Tickets
  const createSupportTicket = (subject: string, category: any, message: string) => {
    if (!currentUser) return;
    const ticketNumber = `TCK-2026-${(supportTickets.length + 101).toString()}`;
    const newTicket: SupportTicket = {
      id: `tkt_${Date.now()}`,
      ticketNumber,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      studentEmail: currentUser.email,
      subject,
      category,
      message,
      status: 'open',
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    showToast(`Support Ticket ${ticketNumber} created. A loan officer will respond shortly!`, 'success');
  };

  const replyToSupportTicket = (ticketId: string, message: string) => {
    if (!currentUser || !message.trim()) return;

    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const newReplies = [
            ...t.replies,
            {
              id: `rep_${Date.now()}`,
              senderId: currentUser.id,
              senderName: currentUser.fullName,
              senderRole: currentUser.role === 'student' ? 'Student' : 'POKOLA Officer',
              message,
              timestamp: new Date().toISOString(),
            },
          ];
          return {
            ...t,
            replies: newReplies,
            status: currentUser.role === 'student' ? 'open' : 'in_progress',
            updatedAt: new Date().toISOString(),
          };
        }
        return t;
      })
    );
    showToast('Reply sent successfully!', 'success');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, isRead: true } : n))
    );
    showToast('All notifications marked as read', 'info');
  };

  // Reset Demo Data
  const resetDemoData = () => {
    setAllUsers([...INITIAL_STAFF, ...INITIAL_STUDENTS]);
    setCurrentUser(INITIAL_STUDENTS[0]);
    setApplications(INITIAL_APPLICATIONS);
    setLoans(INITIAL_LOANS);
    setRepayments(INITIAL_REPAYMENTS);
    setSettings(INITIAL_BUSINESS_SETTINGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSupportTickets(INITIAL_SUPPORT_TICKETS);
    localStorage.clear();
    showToast('Demo data reset to original state!', 'success');
  };

  // Export CSV
  const exportCSV = (type: 'loans' | 'applications' | 'repayments' | 'audit') => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `pokola_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'loans') {
      csvContent += 'Loan Number,Student Name,Institution,Principal,Interest,Total Repayable,Amount Paid,Balance,Status,Due Date,Disbursed At\n';
      loans.forEach((l) => {
        csvContent += `"${l.loanNumber}","${l.studentName}","${l.institution}",${l.principal},${l.interestAmount},${l.totalRepayable},${l.amountPaid},${l.balance},"${l.status}","${l.dueDate}","${l.disbursedAt}"\n`;
      });
    } else if (type === 'applications') {
      csvContent += 'Application Number,Student Name,Institution,Requested Amount,Interest,Total,Status,Risk Level,Risk Score,Applied At\n';
      applications.forEach((a) => {
        csvContent += `"${a.applicationNumber}","${a.studentName}","${a.institution}",${a.requestedAmount},${a.calculatedInterest},${a.totalRepayment},"${a.status}","${a.riskEvaluation?.riskLevel || 'N/A'}",${a.riskEvaluation?.riskScore || 0},"${a.appliedAt}"\n`;
      });
    } else if (type === 'repayments') {
      csvContent += 'Receipt Number,Loan Number,Student Name,Amount,Date,Payment Method,Transaction Reference,Recorded By\n';
      repayments.forEach((r) => {
        csvContent += `"${r.receiptNumber}","${r.loanNumber}","${r.studentName}",${r.amount},"${r.date}","${r.paymentMethod}","${r.transactionReference}","${r.recordedByName}"\n`;
      });
    } else {
      csvContent += 'Timestamp,User Name,Role,Action,Affected Type,Affected ID,Details\n';
      auditLogs.forEach((l) => {
        csvContent += `"${l.timestamp}","${l.userName}","${l.userRole}","${l.action}","${l.affectedRecordType}","${l.affectedRecordId}","${l.details.replace(/"/g, '""')}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filename} successfully!`, 'success');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        allUsers,
        applications,
        loans,
        repayments,
        settings,
        auditLogs,
        notifications,
        announcements,
        fcmTokens,
        pushPreferences,
        supportTickets,
        registerStudent,
        updateUserProfile,
        submitLoanApplication,
        reviewApplication,
        acceptLoanAgreement,
        recordRepayment,
        updateLoanStatus,
        updateBusinessSettings,
        triggerPaymentReminders,
        broadcastAnnouncement,
        deleteAnnouncement,
        requestPushPermission,
        updatePushPreferences,
        simulateTestPushNotification,
        createSupportTicket,
        replyToSupportTicket,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,
        resetDemoData,
        exportCSV,
        toastMessage,
        showToast,
        isOnline,
        isOfflinePersistenceEnabled,
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
