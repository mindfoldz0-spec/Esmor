export type NotificationPermissionState =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'unsupported';

export type NotificationPlatform = 'ios' | 'android' | 'web';

export type NotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
};

export type ScheduledNotificationSummary = {
  id: string;
  title: string;
  body: string;
  deliverAt: string | null;
};

export type NotificationLogKind = 'sent' | 'received' | 'opened' | 'error';

export type NotificationLogEntry = {
  id: string;
  kind: NotificationLogKind;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  createdAt: string;
};

export type DeviceRegistration = {
  token: string | null;
  projectId: string | null;
  platform: NotificationPlatform;
  registeredAt: string;
};

export type NotificationResponseSummary = {
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  url: string | null;
};
