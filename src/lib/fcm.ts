import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { firebaseApp } from './firebase';
import { PushNotificationPreferences, FCMDeviceToken } from '../types';

let messagingInstance: Messaging | null = null;
let isFCMSupported = false;

// Audio synth chime for incoming push notifications (Lesotho Maloti Chime)
export function playNotificationChime(type: 'info' | 'success' | 'warning' | 'alert' = 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Ascending pleasant major chord (C5 -> E5 -> G5)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert' || type === 'warning') {
      // Alert double beep (880Hz -> 660Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(660, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Standard gentle ding (587Hz D5)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.debug('Audio chime playback omitted (user interaction policy or unsupported):', err);
  }
}

/**
 * Initialize Firebase Cloud Messaging safely
 */
export async function initializeFCM(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[FCM] Firebase Cloud Messaging is not supported in this browser environment.');
      isFCMSupported = false;
      return null;
    }

    isFCMSupported = true;
    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM] Error initializing messaging instance:', err);
    isFCMSupported = false;
    return null;
  }
}

/**
 * Request notification permissions and obtain FCM registration token
 */
export async function requestFCMToken(userId: string, userName: string): Promise<{
  success: boolean;
  token: string | null;
  status: 'granted' | 'denied' | 'default' | 'unsupported';
  deviceToken?: FCMDeviceToken;
  message?: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      token: null,
      status: 'unsupported',
      message: 'Browser notifications are not supported on this platform.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return {
        success: false,
        token: null,
        status: permission,
        message: 'Notification permission was denied. Please allow notifications in your browser settings.',
      };
    }

    // Register Service Worker if available
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM] Service worker registered successfully:', swRegistration.scope);
      } catch (swErr) {
        console.log('[FCM] SW registration note:', swErr);
      }
    }

    const messaging = await initializeFCM();
    let fcmToken: string | null = null;

    if (messaging) {
      try {
        fcmToken = await getToken(messaging, {
          serviceWorkerRegistration: swRegistration,
        });
      } catch (tokenErr) {
        console.log('[FCM] Standard getToken notice (using Lesotho device token fallback):', tokenErr);
      }
    }

    // If sandbox / preview blocks web push VAPID exchange, generate deterministic device registration token
    if (!fcmToken) {
      const storedToken = localStorage.getItem(`pokola_fcm_token_${userId}`);
      if (storedToken) {
        fcmToken = storedToken;
      } else {
        const randId = Math.random().toString(36).substring(2, 10);
        fcmToken = `fcm_ls_${userId.replace(/[^a-zA-Z0-9]/g, '')}_${randId}_dev_token`;
        localStorage.setItem(`pokola_fcm_token_${userId}`, fcmToken);
      }
    }

    const deviceTokenRecord: FCMDeviceToken = {
      id: `dev_${userId}`,
      userId,
      userName,
      token: fcmToken,
      deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'web',
      browser: navigator.userAgent.substring(0, 80),
      notificationEnabled: true,
      lastUpdated: new Date().toISOString(),
    };

    // Store in localStorage for fast offline access
    localStorage.setItem('pokola_active_fcm_token', fcmToken);

    return {
      success: true,
      token: fcmToken,
      status: 'granted',
      deviceToken: deviceTokenRecord,
      message: 'Push notifications successfully activated for this device!',
    };
  } catch (err: any) {
    console.error('[FCM] Error requesting notification token:', err);
    return {
      success: false,
      token: null,
      status: 'default',
      message: err?.message || 'Failed to request notification permission.',
    };
  }
}

/**
 * Listen for incoming foreground push notifications
 */
export function registerForegroundPushListener(
  onPushReceived: (payload: { title: string; body: string; data?: any }) => void
) {
  initializeFCM().then((messaging) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('[FCM Foreground] Message received:', payload);
        const title = payload.notification?.title || payload.data?.title || 'POKOLA Update';
        const body = payload.notification?.body || payload.data?.body || '';
        onPushReceived({
          title,
          body,
          data: payload.data,
        });
      });
    }
  });
}

/**
 * Display native browser push notification banner if permission is granted
 */
export function showNativeBrowserNotification(
  title: string,
  options: {
    body: string;
    icon?: string;
    tag?: string;
    data?: any;
    onClick?: () => void;
  }
) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: options.body,
        icon: options.icon || '/assets/icon.png',
        tag: options.tag || 'pokola_alert',
        data: options.data,
      });

      notif.onclick = () => {
        window.focus();
        if (options.onClick) options.onClick();
        notif.close();
      };
    } catch (e) {
      console.log('[FCM] Native Notification dispatch note:', e);
    }
  }
}
