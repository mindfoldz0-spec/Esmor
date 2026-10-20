import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type {
  NotificationPayload,
  NotificationPermissionState,
  NotificationResponseSummary,
  NotificationPlatform,
  ScheduledNotificationSummary,
} from '@/types/notification';

/** Android channel every Esmor notification is delivered through. */
export const NOTIFICATION_CHANNEL_ID = 'esmor-default';

/** Push notifications only exist on the native builds. */
export const notificationsSupported = true;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function readProjectId() {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  const easConfig = (
    Constants as unknown as { easConfig?: { projectId?: string } }
  ).easConfig;

  return (
    extra?.eas?.projectId ??
    easConfig?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    null
  );
}

/**
 * The EAS project id is required to mint an Expo push token. It normally
 * lives in `extra.eas.projectId` inside app.json, and can be overridden with
 * the EXPO_PUBLIC_EAS_PROJECT_ID environment variable.
 */
export function resolveProjectId(): string | null {
  const projectId = readProjectId();
  return projectId && projectId.length > 0 ? projectId : null;
}

export function getPlatform(): NotificationPlatform {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return Platform.OS;
  }

  return 'web';
}

/** Push tokens are only issued to real hardware. */
export function isPhysicalDevice(): boolean {
  return Device.isDevice === true;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: 'Esmor notifications',
    // The enum is re-exported through a type module, which the import
    // namespace rule cannot follow.
    // eslint-disable-next-line import/namespace
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#F0A96B',
  });
}

function mapPermissionStatus(
  status: Notifications.NotificationPermissionsStatus
): NotificationPermissionState {
  if (status.granted) {
    return 'granted';
  }

  if (status.canAskAgain === false) {
    return 'denied';
  }

  return 'undetermined';
}

export async function getPermissionState(): Promise<NotificationPermissionState> {
  const status = await Notifications.getPermissionsAsync();
  return mapPermissionStatus(status);
}

export async function requestPermission(): Promise<NotificationPermissionState> {
  // The channel has to exist before Android 13 shows the permission prompt.
  await ensureChannel();

  const status = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return mapPermissionStatus(status);
}

export async function getPushToken(projectId: string | null): Promise<string | null> {
  if (!projectId) {
    return null;
  }

  await ensureChannel();

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data ?? null;
}

export async function scheduleLocalNotification(
  payload: NotificationPayload,
  delaySeconds: number
): Promise<string> {
  await ensureChannel();

  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: payload.title,
      body: payload.body,
      data: (payload.data ?? {}) as Record<string, unknown>,
      sound: true,
    },
    trigger:
      delaySeconds > 0
        ? {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: delaySeconds,
            channelId: NOTIFICATION_CHANNEL_ID,
          }
        : null,
  });

  return identifier;
}

function describeTrigger(
  trigger: Notifications.NotificationTrigger | null
): string | null {
  if (!trigger) {
    return null;
  }

  const value = (trigger as { value?: unknown }).value;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'number') {
    return new Date(Date.now() + value * 1000).toISOString();
  }

  return null;
}

export async function listScheduledNotifications(): Promise<
  ScheduledNotificationSummary[]
> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();

  return requests.map((request) => ({
    id: request.identifier,
    title: request.content.title ?? '',
    body: request.content.body ?? '',
    deliverAt: describeTrigger(request.trigger),
  }));
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

export function addReceivedListener(
  listener: (payload: NotificationPayload) => void
): () => void {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      listener({
        title: notification.request.content.title ?? '',
        body: notification.request.content.body ?? '',
        data: (notification.request.content.data ?? null) as Record<
          string,
          unknown
        > | null,
      });
    }
  );

  return () => subscription.remove();
}

function toResponseSummary(
  response: Notifications.NotificationResponse
): NotificationResponseSummary {
  const content = response.notification.request.content;
  const data = (content.data ?? null) as Record<string, unknown> | null;
  const url = typeof data?.url === 'string' ? data.url : null;

  return {
    title: content.title ?? '',
    body: content.body ?? '',
    data,
    url,
  };
}

export function addResponseListener(
  listener: (payload: NotificationResponseSummary) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      listener(toResponseSummary(response));
    }
  );

  return () => subscription.remove();
}

export async function getLastResponse(): Promise<NotificationResponseSummary | null> {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();

    if (!response) {
      return null;
    }

    return toResponseSummary(response);
  } catch {
    return null;
  }
}

export async function clearLastResponse(): Promise<void> {
  try {
    await Notifications.clearLastNotificationResponseAsync();
  } catch {
    // Nothing to clear.
  }
}
