import type {
  NotificationPayload,
  NotificationPermissionState,
  NotificationResponseSummary,
  NotificationPlatform,
  ScheduledNotificationSummary,
} from '@/types/notification';

/**
 * `expo-notifications` only ships native modules, so the web build swaps in
 * this shim. Every call becomes a safe no-op and the UI explains that a
 * device build is required for real push notifications.
 */
export const notificationsSupported = false;

export function resolveProjectId(): string | null {
  return process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? null;
}

export function getPlatform(): NotificationPlatform {
  return 'web';
}

export function isPhysicalDevice(): boolean {
  return false;
}

export async function getPermissionState(): Promise<NotificationPermissionState> {
  return 'unsupported';
}

export async function requestPermission(): Promise<NotificationPermissionState> {
  return 'unsupported';
}

export async function getPushToken(): Promise<string | null> {
  return null;
}

export async function scheduleLocalNotification(): Promise<string> {
  throw new Error('Notifications are not available on the web build.');
}

export async function listScheduledNotifications(): Promise<
  ScheduledNotificationSummary[]
> {
  return [];
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  // Nothing is scheduled on the web build.
}

export async function getBadgeCount(): Promise<number> {
  return 0;
}

export async function setBadgeCount(): Promise<void> {
  // The web build has no app badge.
}

export function addReceivedListener(
  _listener: (payload: NotificationPayload) => void
): () => void {
  return () => {};
}

export function addResponseListener(
  _listener: (payload: NotificationResponseSummary) => void
): () => void {
  return () => {};
}

export async function getLastResponse(): Promise<NotificationResponseSummary | null> {
  return null;
}

export async function clearLastResponse(): Promise<void> {
  // Nothing to clear.
}
