import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { SyncQueueItem, SyncServiceState, SyncItemType } from '../types';

const QUEUE_STORAGE_KEY = 'pokola_offline_sync_queue_v2';
const HISTORY_STORAGE_KEY = 'pokola_offline_sync_history_v2';
const SIMULATED_OFFLINE_KEY = 'pokola_simulated_offline_v2';
const LAST_SYNC_KEY = 'pokola_last_sync_time_v2';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Sync Notice:', JSON.stringify(errInfo));
  return errInfo;
}

type SyncListener = (state: SyncServiceState, queue: SyncQueueItem[], history: SyncQueueItem[]) => void;

class BackgroundSyncService {
  private queue: SyncQueueItem[] = [];
  private history: SyncQueueItem[] = [];
  private listeners: Set<SyncListener> = new Set();
  private isProcessing: boolean = false;
  private isSimulatedOffline: boolean = false;
  private lastSyncTimestamp: string | null = null;
  private totalSyncedCount: number = 0;
  private syncErrors: string[] = [];
  private autoSyncTimer: any = null;

  constructor() {
    this.loadState();
    this.setupNetworkListeners();
    this.startPeriodicSyncCheck();
  }

  private loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (storedQueue) {
          this.queue = JSON.parse(storedQueue);
        }

        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          this.history = JSON.parse(storedHistory);
        }

        const storedSim = localStorage.getItem(SIMULATED_OFFLINE_KEY);
        if (storedSim) {
          this.isSimulatedOffline = JSON.parse(storedSim);
        }

        const storedLastSync = localStorage.getItem(LAST_SYNC_KEY);
        if (storedLastSync) {
          this.lastSyncTimestamp = storedLastSync;
        }
      }
    } catch (e) {
      console.error('Failed to load offline sync state from storage:', e);
    }
  }

  private persistQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history.slice(0, 30)));
        localStorage.setItem(SIMULATED_OFFLINE_KEY, JSON.stringify(this.isSimulatedOffline));
        if (this.lastSyncTimestamp) {
          localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTimestamp);
        }
      }
    } catch (e) {
      console.error('Failed to persist offline sync queue:', e);
    }
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[POKOLA Sync Service] Internet connection regained. Triggering background sync flush...');
        this.notifyListeners();
        // Give connection 1 second to stabilize before pushing
        setTimeout(() => {
          this.processSyncQueue();
        }, 1000);
      });

      window.addEventListener('offline', () => {
        console.log('[POKOLA Sync Service] Device entered offline mode. Mutations will be queued locally.');
        this.notifyListeners();
      });
    }
  }

  private startPeriodicSyncCheck() {
    // Check every 20 seconds if online and there are pending items
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }
    this.autoSyncTimer = setInterval(() => {
      if (this.isOnline() && this.getPendingCount() > 0 && !this.isProcessing) {
        this.processSyncQueue();
      }
    }, 20000);
  }

  public isOnline(): boolean {
    if (this.isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  public setSimulatedOffline(val: boolean) {
    this.isSimulatedOffline = val;
    this.persistQueue();
    this.notifyListeners();

    if (!val && this.isOnline()) {
      // Returned online -> immediately flush pending queue
      setTimeout(() => {
        this.processSyncQueue();
      }, 500);
    }
  }

  public toggleSimulatedOffline(): boolean {
    this.setSimulatedOffline(!this.isSimulatedOffline);
    return this.isSimulatedOffline;
  }

  public getPendingCount(): number {
    return this.queue.filter((i) => i.status === 'pending' || i.status === 'failed').length;
  }

  public getState(): SyncServiceState {
    const pendingItems = this.queue.filter((i) => i.status === 'pending' || i.status === 'failed');
    const pendingAuditCount = pendingItems.filter((i) => i.type === 'AUDIT_LOG').length;
    const pendingLoanCount = pendingItems.filter((i) => i.type !== 'AUDIT_LOG').length;

    let status: SyncServiceState['status'] = 'idle';
    if (this.isProcessing) {
      status = 'syncing';
    } else if (!this.isOnline()) {
      status = 'offline';
    } else if (this.syncErrors.length > 0 && pendingItems.length > 0) {
      status = 'error';
    } else if (pendingItems.length === 0) {
      status = 'synced';
    }

    return {
      status,
      isOnline: this.isOnline(),
      isSimulatedOffline: this.isSimulatedOffline,
      pendingCount: pendingItems.length,
      pendingAuditCount,
      pendingLoanCount,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastSyncSuccessCount: this.history.length,
      totalSyncedCount: this.totalSyncedCount,
      syncErrors: this.syncErrors,
      isAutoSyncEnabled: true,
    };
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getHistory(): SyncQueueItem[] {
    return [...this.history];
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Trigger initial notification
    listener(this.getState(), this.getQueue(), this.getHistory());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    const queue = this.getQueue();
    const history = this.getHistory();
    this.listeners.forEach((fn) => {
      try {
        fn(state, queue, history);
      } catch (err) {
        console.error('Error in sync listener callback:', err);
      }
    });
  }

  /**
   * Enqueue a generic mutation into the background sync queue.
   */
  public enqueueSyncItem(
    type: SyncItemType,
    collection: SyncQueueItem['collection'],
    docId: string,
    payload: any,
    summary: string
  ): SyncQueueItem {
    // If an item with the same docId and collection is already in pending state, update its payload
    const existingIndex = this.queue.findIndex(
      (item) => item.collection === collection && item.docId === docId && item.status !== 'syncing'
    );

    const now = new Date().toISOString();
    let queuedItem: SyncQueueItem;

    if (existingIndex >= 0) {
      queuedItem = {
        ...this.queue[existingIndex],
        payload: { ...this.queue[existingIndex].payload, ...payload },
        summary,
        lastAttemptAt: now,
        status: 'pending',
      };
      this.queue[existingIndex] = queuedItem;
    } else {
      queuedItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type,
        collection,
        docId,
        payload,
        createdAt: now,
        attempts: 0,
        status: 'pending',
        summary,
      };
      this.queue.push(queuedItem);
    }

    this.persistQueue();
    this.notifyListeners();

    // If device is online, attempt immediate background push
    if (this.isOnline() && !this.isProcessing) {
      setTimeout(() => {
        this.processSyncQueue();
      }, 300);
    }

    return queuedItem;
  }

  /**
   * Convenience helper for audit logs
   */
  public enqueueAuditLog(log: {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    affectedRecordType: string;
    affectedRecordId: string;
    previousValue?: string;
    newValue?: string;
    ipAddress?: string;
    details: string;
  }) {
    return this.enqueueSyncItem(
      'AUDIT_LOG',
      'auditLogs',
      log.id,
      {
        ...log,
        createdAt: log.timestamp || new Date().toISOString(),
      },
      `Audit Log: ${log.action} on ${log.affectedRecordType} (${log.affectedRecordId})`
    );
  }

  /**
   * Convenience helper for loan creations & updates
   */
  public enqueueLoan(loan: any, isNewLoan: boolean = false) {
    return this.enqueueSyncItem(
      isNewLoan ? 'LOAN_CREATE' : 'LOAN_UPDATE',
      'loans',
      loan.id,
      loan,
      `Loan #${loan.loanNumber || loan.id} (${loan.status}) - ${loan.studentName || 'Student'}`
    );
  }

  /**
   * Convenience helper for repayments
   */
  public enqueueRepayment(repayment: any) {
    return this.enqueueSyncItem(
      'LOAN_REPAYMENT',
      'repayments',
      repayment.id,
      repayment,
      `Repayment receipt #${repayment.receiptNumber || repayment.id} (M${repayment.amount})`
    );
  }

  /**
   * Convenience helper for loan applications
   */
  public enqueueApplication(application: any, isNew: boolean = false) {
    return this.enqueueSyncItem(
      isNew ? 'APPLICATION_CREATE' : 'APPLICATION_UPDATE',
      'loanApplications',
      application.id,
      application,
      `Application #${application.applicationNumber || application.id} (${application.status})`
    );
  }

  /**
   * Main Background Synchronization Processor.
   * Pulls pending items, attempts writes to Firestore, updates statuses, and handles backoff.
   */
  public async processSyncQueue(force: boolean = false): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
    message: string;
  }> {
    if (this.isProcessing) {
      return { success: false, syncedCount: 0, failedCount: 0, message: 'Sync already in progress' };
    }

    if (!this.isOnline() && !force) {
      return { success: false, syncedCount: 0, failedCount: 0, message: 'Device is offline. Queued for reconnection.' };
    }

    const pendingItems = this.queue.filter((i) => i.status === 'pending' || i.status === 'failed');
    if (pendingItems.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0, message: 'All items are up to date' };
    }

    this.isProcessing = true;
    this.syncErrors = [];
    this.notifyListeners();

    let syncedCount = 0;
    let failedCount = 0;
    const syncedIds: string[] = [];

    console.log(`[POKOLA Sync Service] Processing ${pendingItems.length} queued mutations to Firestore...`);

    for (const item of pendingItems) {
      item.status = 'syncing';
      item.attempts += 1;
      item.lastAttemptAt = new Date().toISOString();
      this.notifyListeners();

      try {
        const docRef = doc(db, item.collection, item.docId);
        
        // Clean payload for Firestore write
        const cleanPayload = { ...item.payload };
        
        // Ensure server timestamp flag
        cleanPayload._syncedAt = new Date().toISOString();
        cleanPayload._offlineSynced = true;

        await setDoc(docRef, cleanPayload, { merge: true });

        // Successfully pushed to Firestore
        item.status = 'synced';
        syncedIds.push(item.id);
        syncedCount++;
        this.totalSyncedCount++;

        // Add to history
        this.history.unshift({ ...item, status: 'synced' });
        console.log(`[POKOLA Sync Service] Successfully synced item ${item.id} (${item.summary}) to Firestore.`);
      } catch (err: any) {
        item.status = 'failed';
        item.lastError = err?.message || 'Network write failure';
        failedCount++;
        this.syncErrors.push(`${item.summary}: ${item.lastError}`);
        handleFirestoreError(err, OperationType.WRITE, `${item.collection}/${item.docId}`);
      }
    }

    // Remove successfully synced items from pending queue
    this.queue = this.queue.filter((i) => !syncedIds.includes(i.id));

    this.lastSyncTimestamp = new Date().toISOString();
    this.isProcessing = false;
    this.persistQueue();
    this.notifyListeners();

    const resultMessage =
      syncedCount > 0
        ? `Successfully synchronized ${syncedCount} record${syncedCount > 1 ? 's' : ''} with Cloud Firestore`
        : failedCount > 0
        ? `Failed to sync ${failedCount} record(s). Will retry automatically.`
        : 'Sync completed';

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
      message: resultMessage,
    };
  }

  public retryFailedItems() {
    this.queue.forEach((i) => {
      if (i.status === 'failed') {
        i.status = 'pending';
        i.lastError = undefined;
      }
    });
    this.syncErrors = [];
    this.persistQueue();
    this.notifyListeners();
    return this.processSyncQueue();
  }

  public clearCompletedQueue() {
    this.queue = this.queue.filter((i) => i.status === 'pending');
    this.history = [];
    this.persistQueue();
    this.notifyListeners();
  }
}

// Export singleton instance
export const syncService = new BackgroundSyncService();
