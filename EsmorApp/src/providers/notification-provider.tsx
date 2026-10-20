import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useI18n } from '@/i18n';
import {
  addReceivedListener,
  addResponseListener,
  cancelAllScheduledNotifications,
  clearLastResponse,
  getLastResponse,
  getPermissionState,
  getPlatform,
  getPushToken,
  isPhysicalDevice,
  listScheduledNotifications,
  notificationsSupported,
  requestPermission,
  resolveProjectId,
  scheduleLocalNotification,
} from '@/lib/notification-service';
import { registerDeviceWithServer } from '@/lib/notification-server';
import {
  appendNotificationLog,
  clearNotificationLog,
  deleteNotificationData,
  getDeviceRegistration,
  getNotificationLog,
  saveDeviceRegistration,
} from '@/lib/notification-store';
import type {
  DeviceRegistration,
  NotificationLogEntry,
  NotificationPayload,
  NotificationPermissionState,
  NotificationPlatform,
  ScheduledNotificationSummary,
} from '@/types/notification';

type NotificationContextValue = {
  supported: boolean;
  permission: NotificationPermissionState;
  registration: DeviceRegistration | null;
  log: NotificationLogEntry[];
  scheduled: ScheduledNotificationSummary[];
  projectId: string | null;
  platform: NotificationPlatform;
  physicalDevice: boolean;
  busy: boolean;
  error: string | null;
  pendingRoute: string | null;
  enableNotifications: () => Promise<boolean>;
  sendLocalNotification: (
    payload: NotificationPayload,
    delaySeconds: number
  ) => Promise<boolean>;
  refresh: () => Promise<void>;
  cancelScheduled: () => Promise<void>;
  clearLog: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  dismissError: () => void;
  consumePendingRoute: () => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

function createLogId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type NotificationState = {
  permission: NotificationPermissionState;
  scheduled: ScheduledNotificationSummary[];
  registration: DeviceRegistration | null;
  log: NotificationLogEntry[];
};

async function loadNotificationState(): Promise<NotificationState> {
  const [permission, scheduled, registration, log] = await Promise.all([
    getPermissionState(),
    listScheduledNotifications(),
    getDeviceRegistration(),
    getNotificationLog(),
  ]);

  return { permission, scheduled, registration, log };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [permission, setPermission] = useState<NotificationPermissionState>(
    notificationsSupported ? 'undetermined' : 'unsupported'
  );
  const [registration, setRegistration] = useState<DeviceRegistration | null>(null);
  const [log, setLog] = useState<NotificationLogEntry[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledNotificationSummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  const appendLog = useCallback(
    async (entry: Omit<NotificationLogEntry, 'id' | 'createdAt'>) => {
      const next = await appendNotificationLog({
        ...entry,
        id: createLogId(),
        createdAt: new Date().toISOString(),
      });

      setLog(next);
    },
    []
  );

  const refresh = useCallback(async () => {
    try {
      const next = await loadNotificationState();

      setPermission(next.permission);
      setScheduled(next.scheduled);
      setRegistration(next.registration);
      setLog(next.log);
    } catch (cause) {
      console.warn('Could not refresh the notification state.', cause);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const next = await loadNotificationState();

        if (cancelled) {
          return;
        }

        setPermission(next.permission);
        setScheduled(next.scheduled);
        setRegistration(next.registration);
        setLog(next.log);
      } catch (cause) {
        console.warn('Could not load the notification state.', cause);
      }
    }

    void hydrate();

    const removeReceivedListener = addReceivedListener((payload) => {
      void appendLog({
        kind: 'received',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
      });
    });

    const removeResponseListener = addResponseListener((payload) => {
      void appendLog({
        kind: 'opened',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? null,
      });

      if (payload.url) {
        setPendingRoute(payload.url);
      }
    });

    return () => {
      cancelled = true;
      removeReceivedListener();
      removeResponseListener();
    };
  }, [appendLog]);

  // A notification that opened the app from a cold start still has to route.
  useEffect(() => {
    let cancelled = false;

    async function handleInitialResponse() {
      const response = await getLastResponse();

      if (!response || cancelled) {
        return;
      }

      await clearLastResponse();

      if (!cancelled && response.url) {
        setPendingRoute(response.url);
      }
    }

    void handleInitialResponse();

    return () => {
      cancelled = true;
    };
  }, []);

  const enableNotifications = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const nextPermission = await requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        setError(t('notifications.permissionError'));
        return false;
      }

      const projectId = resolveProjectId();
      let token: string | null = null;

      try {
        token = await getPushToken(projectId);
      } catch (cause) {
        console.warn('Could not read the Expo push token.', cause);
      }

      const nextRegistration = await saveDeviceRegistration({
        token,
        projectId,
        platform: getPlatform(),
        registeredAt: new Date().toISOString(),
      });

      setRegistration(nextRegistration);

      if (token) {
        const result = await registerDeviceWithServer({
          token,
          platform: nextRegistration.platform,
          projectId,
          registeredAt: nextRegistration.registeredAt,
        });

        if (result === 'failed') {
          setError(t('notifications.serverUnreachable'));
        } else if (result === 'not-configured') {
          setError(t('notifications.serverNotConfigured'));
        }
      } else {
        setError(t('notifications.tokenMissingHint'));
      }

      await refresh();
      return true;
    } catch (cause) {
      console.warn('Could not enable notifications.', cause);
      setError(t('notifications.enableError'));
      return false;
    } finally {
      setBusy(false);
    }
  }, [refresh, t]);

  const sendLocalNotification = useCallback(
    async (payload: NotificationPayload, delaySeconds: number) => {
      setBusy(true);
      setError(null);

      try {
        await scheduleLocalNotification(payload, delaySeconds);

        await appendLog({
          kind: 'sent',
          title: payload.title,
          body: payload.body,
          data: payload.data ?? null,
        });

        await refresh();
        return true;
      } catch (cause) {
        console.warn('Could not schedule the notification.', cause);
        setError(t('notifications.sendError'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [appendLog, refresh, t]
  );

  const cancelScheduled = useCallback(async () => {
    setBusy(true);

    try {
      await cancelAllScheduledNotifications();
      await refresh();
    } catch (cause) {
      console.warn('Could not cancel the scheduled notifications.', cause);
      setError(t('notifications.cancelError'));
    } finally {
      setBusy(false);
    }
  }, [refresh, t]);

  const clearLog = useCallback(async () => {
    await clearNotificationLog();
    setLog([]);
  }, []);

  const clearLocalData = useCallback(async () => {
    await deleteNotificationData();
    setRegistration(null);
    setLog([]);
    setScheduled([]);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  const consumePendingRoute = useCallback(() => setPendingRoute(null), []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      supported: notificationsSupported,
      permission,
      registration,
      log,
      scheduled,
      projectId: resolveProjectId(),
      platform: getPlatform(),
      physicalDevice: isPhysicalDevice(),
      busy,
      error,
      pendingRoute,
      enableNotifications,
      sendLocalNotification,
      refresh,
      cancelScheduled,
      clearLog,
      clearLocalData,
      dismissError,
      consumePendingRoute,
    }),
    [
      permission,
      registration,
      log,
      scheduled,
      busy,
      error,
      pendingRoute,
      enableNotifications,
      sendLocalNotification,
      refresh,
      cancelScheduled,
      clearLog,
      clearLocalData,
      dismissError,
      consumePendingRoute,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider.');
  }

  return context;
}

/** Short, translated description of the current permission state. */
export function useNotificationPermissionLabel() {
  const { t } = useI18n();
  const { permission } = useNotifications();

  return useMemo(() => {
    switch (permission) {
      case 'granted':
        return t('notifications.permissionGranted');
      case 'denied':
        return t('notifications.permissionDenied');
      case 'unsupported':
        return t('notifications.permissionUnsupported');
      default:
        return t('notifications.permissionUndetermined');
    }
  }, [permission, t]);
}
